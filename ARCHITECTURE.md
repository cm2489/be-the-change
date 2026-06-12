# ARCHITECTURE.md

How the system fits together. When Claude or any engineer needs to understand integration boundaries, start here.

**Since the 2026-06-11 pivot (`docs/PIVOT.md`), the product is the MCP server + API; the web app is the reference client.** Sections below describing web-app flows remain accurate for that client.

---

## Stack Overview

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js | 16.2.4 | App Router, `proxy.ts` (not `middleware.ts`), Node.js runtime |
| MCP Server | `mcp-handler` (Vercel) | — | Remote MCP, Streamable HTTP, at `app/api/[transport]/route.ts` (F2) |
| UI Library | React | 19 | Server Components default |
| Styling | Tailwind CSS | v3 only | Do not mix v4 packages |
| Language | TypeScript | 5.8+ | Strict mode |
| Auth / DB / Storage | Supabase | — | Use `@supabase/ssr` only. `@supabase/auth-helpers-nextjs` is deprecated. MCP Phase 2 auth = OAuth 2.1 (`withMcpAuth`) on the same Supabase identities. |
| AI | Anthropic SDK | 0.39+ | Claude models for script generation + sync-time summaries/headlines |
| Billing | Stripe | — | F6 only: Billing Meters + Checkout + Customer Portal + Tax. API billing only — no consumer payments. |
| Email | Resend | 4.5+ | Transactional only (password reset, welcome) |
| Push Notifications | ~~`web-push`~~ | — | SUPERSEDED by webhooks/agent updates (pivot 2026-06-11). Do not build on. |
| Hosting | Vercel | — | Auto-deploy from `main` branch; Fluid compute handles MCP traffic |
| Cron Jobs | Vercel Cron | — | Secured by `CRON_SECRET` header |

## External APIs

### Congress.gov API
- **Purpose:** Federal bill data, federal rep data, voting records
- **Env var:** `CONGRESS_API_KEY`
- **Rate limit:** Check current limits at api.congress.gov
- **Usage pattern:** Sync to Supabase nightly via cron. Never call from user-facing requests.
- **Docs:** https://api.congress.gov/

### Google Civic Information API (Divisions ONLY)
- **Purpose:** Geocoding address → Open Civic Data ID (OCD-ID) for district lookup
- **Env var:** `GOOGLE_CIVIC_API_KEY`
- **CRITICAL:** The `representativeInfoByAddress` and `representativeInfoByDivision` endpoints were shut down April 30, 2025. DO NOT USE THESE. Only use the Divisions API for OCD-ID lookup.
- **Docs:** https://developers.google.com/civic-information

### Anthropic Claude API
- **Purpose:** Personalized call script generation
- **Env var:** `ANTHROPIC_API_KEY`
- **Cost control:** Anthropic API is prepaid — the loaded credit balance with auto-reload OFF is the hard spend ceiling (no postpaid daily cap exists on this account type). Script generation is cached server-side per `(user_id, bill_id, stance)` tuple.
- **Docs:** https://docs.claude.com/

## Data Flow Diagrams (Text Format)

### Flow 1: Sign-Up & Profile Creation
```
User → Next.js /signup page (client component)
  → Server action: createAccount(email, password)
    → Supabase Auth (create user)
    → Supabase `profiles` table (insert row with user_id)
  → Redirect to /onboarding
  → User fills ZIP, values, priorities
  → Server action: updateProfile(data)
    → Supabase `profiles` table (update)
  → Redirect to /feed
```

### Flow 2: Finding a User's Representatives
```
User provides address on /profile
  → Server action: lookupReps(address)
    → Google Civic Divisions API (geocode → OCD-ID)
    → Supabase `representatives` table (check cache)
    → If cache miss: Congress.gov API (fetch reps for district)
    → Upsert to `representatives` table
    → Link user to reps in `user_representatives` join table
  → Return reps to UI
```

### Flow 3: Nightly Bill Sync (Cron)
```
Vercel Cron → /api/cron/sync-bills (with CRON_SECRET header)
  → Verify CRON_SECRET
  → Congress.gov API (fetch recently-updated bills)
  → For each bill:
    → Upsert to `bills` table
    → Update `bill_actions` table (status changes)
  → If any bill moved to "pending vote" status:
    → Query users following this bill
    → Queue push notifications (respecting per-user rate limits)
  → Return count to logs
```

### Flow 4: AI Script Generation
```
User on /bills/[bill_id] → clicks "Get script" → selects stance (support/oppose/undecided)
  → Server action: generateScript(bill_id, stance)
    → Check `script_generations` cache for (user_id, bill_id, stance)
    → If hit: return cached script
    → If miss:
      → Build prompt with user profile + bill summary + stance
      → Call Anthropic API
      → Log generation to `script_generations`
      → Return script
  → Display in editable textarea with "AI-drafted, review before use" disclaimer
  → User edits → clicks "Save & Review"
  → Server action: saveScript(script_text)
  → "Call Now" button becomes active
```

### Flow 5: Logging a Call
```
User clicks "Call Now" (mobile: opens tel: link; desktop: reveals phone number)
  → On page return / button confirmation: "Did you make the call?"
  → Server action: logCall(bill_id, rep_id)
    → Insert to `call_events` table
  → Update user dashboard stats
```

### Flow 6: ~~Push Notification Delivery~~ (SUPERSEDED — see Flow 8)
Web push was superseded by webhooks + agent-native updates in the 2026-06-11 pivot. Never built; do not build.

### Flow 7: MCP Tool Call (metered)
```
Agent / MCP client → POST /api/[transport] (Streamable HTTP)
  → mcp-handler routes to tool (search_bills, decode_bill, lookup_representatives,
    draft_call_script, track_bill, get_updates, get_upcoming_activity, get_rep_profile, ...)
  → Metering middleware:
    → Resolve caller: anonymous (rate-limited free tier) | API key (Supabase lookup) | OAuth user
    → Check entitlements (tier limits: calls/mo, tracked bills) — server-side, hard fail
    → Record usage event → Stripe Billing Meter (keyed callers)
  → Tool handler wraps existing lib/ code → reads Supabase (never Congress.gov live)
  → draft_call_script: check script_generations cache → generate on miss → log → return with disclaimer
```

### Flow 8: Tracked-Bill Updates + Webhooks (replaces push)
```
Nightly sync cron (Flow 3) → diffs bill status / bill_actions
  → For each changed bill with trackers:
    → Write update events (consumed by get_updates(since) polls)
    → For paid tiers with a webhook URL:
      → Signed POST (HMAC), retry with backoff, log delivery status
```

### Flow 9: Billing Lifecycle (zero-touch)
```
Developer → /developers page → signup → API key issued (hashed, RLS row)
  → Stripe Checkout (tier selection) → webhook → entitlements row updated in Supabase
  → Usage events stream to Stripe Billing Meters (from Flow 7 middleware)
  → Stripe invoices/charges automatically; Customer Portal for self-serve changes; Stripe Tax for compliance
  → Webhook on payment failure / cancellation → entitlements downgraded to Free
```

## Authentication & Authorization Model

- **Auth provider:** Supabase Auth — email+password + **Google OAuth** (login + signup, both routed through the `/api/auth/callback` PKCE exchange). Apple OAuth still deferred.
- **Session storage:** Supabase cookie-based session, managed by `@supabase/ssr`
- **Route protection:** Enforced in `proxy.ts` at the network boundary
- **Public routes:** `/`, `/login`, `/signup`, `/api/cron/*`, `/api/auth/*`
- **All other routes** require an authenticated session
- **Row-Level Security (RLS):** ON for every table. Users can only access their own rows.

## Environment Variables

See `.env.local.example` for the canonical list. MVP-required variables:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_CIVIC_API_KEY` (Divisions endpoint only)
- `CONGRESS_API_KEY`
- `RESEND_API_KEY`
- `CRON_SECRET`

Arriving with F6 (that PR, not before): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

Variables that should NOT be present: `LEGISCAN_API_KEY` (v2), `TWILIO_*` (never), `*VAPID*` (web push superseded — remove from env when convenient).

## Deployment

- **Production:** Auto-deploy from `main` branch to Vercel
- **Preview:** Every PR gets a Vercel preview URL
- **Database migrations:** Applied via Supabase CLI (`supabase db push`) from local machine. Migration files live in `supabase/migrations/`.
- **Env var management:** Vercel dashboard for production, `.env.local` for local dev (gitignored).

## Observability (MVP Minimum)

- **Logs:** Vercel log drain (built-in)
- **Errors:** `console.error` for MVP; Sentry integration deferred to v1.1
- **Anthropic spend:** Daily check of Anthropic dashboard until automated alerting is added
- **Supabase usage:** Dashboard monitoring for query volume, storage, egress

## Known Constraints & Gotchas

1. **Next.js 16 is new.** Most Claude training data predates this version. Caching semantics, middleware-to-proxy rename, and some Server Component patterns differ from v14/v15. Always check Next.js 16 docs when in doubt.
2. **Supabase free tier has connection limits.** Keep server actions short; don't hold connections open.
3. **Congress.gov API has rate limits.** All reads go through the Supabase cache, never directly to Congress.gov from user requests.
4. **Vercel cron jobs** are only available on Pro plan. Budget $20/mo for this.
5. **Push notification permissions on iOS** require the app to be installed as a PWA (Add to Home Screen). Document this in the onboarding flow.

## Future Architecture Considerations (post-MVP, not now)

- Move from Vercel to AWS/Cloudflare if egress costs become prohibitive at scale
- Add Redis (Upstash) for rate limiting and LLM response caching if Supabase queries become the bottleneck
- Add Sentry for error tracking
- Add PostHog for product analytics (post-MVP, and only after privacy review)
- Add Turnstile or hCaptcha on signup before any viral launch event
