# ARCHITECTURE.md

How the system fits together. When Claude or any engineer needs to understand integration boundaries, start here.

---

## Stack Overview

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js | 16.2.4 | App Router, `proxy.ts` (not `middleware.ts`), Node.js runtime |
| UI Library | React | 19 | Server Components default |
| Styling | Tailwind CSS | v3 only | Do not mix v4 packages |
| Language | TypeScript | 5.8+ | Strict mode |
| Auth / DB / Storage | Supabase | — | Use `@supabase/ssr` only. `@supabase/auth-helpers-nextjs` is deprecated. |
| AI | Anthropic SDK | 0.39+ | Claude models for script generation |
| Email | Resend | 4.5+ | Transactional only (password reset, welcome) |
| Push Notifications | `web-push` | 3.6+ | VAPID-based Web Push Protocol |
| Hosting | Vercel | — | Auto-deploy from `main` branch |
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
- **Cost control:** Hard daily spend cap set in Anthropic dashboard. Script generation is cached server-side per `(user_id, bill_id, stance)` tuple.
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

### Flow 6: Push Notification Delivery
```
Cron or event trigger → /api/push/send (internal, CRON_SECRET protected)
  → Query eligible notifications (users following bills with pending actions)
  → For each:
    → Check per-user daily rate limit (max 2/day)
    → Check user's local time (no pushes 9pm–8am)
    → Send via web-push library
    → Log to `notifications_sent` table
```

## Authentication & Authorization Model

- **Auth provider:** Supabase Auth (email+password for MVP; OAuth deferred)
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
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
- `CRON_SECRET`

Variables that should NOT be present until v2: `STRIPE_*`, `LEGISCAN_API_KEY`, `TWILIO_*`.

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
