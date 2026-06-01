# Deferred Work & Known Limitations

This file tracks every "we did not handle this" item in the codebase — intentional MVP trade-offs, scope violations surfaced during sweeps, quality debt, and v2 roadmap items already flagged in code. It is the single place to go before closing out a release to ask "what did we punt?"

**This is distinct from `FEATURES.md`.** FEATURES.md is "do not build this feature." This file is "we built the feature, but these edges aren't covered yet."

## How to use

- When you add a `// TODO`, `// v2`, `// deferred`, or "known limitation" code comment, **add an entry here with a matching anchor slug**. Cross-link both directions. If the comment says `see docs/deferred.md#foo`, this file must have `#foo`.
- When you close an item out, remove it from this file **and** remove the comment from the code in the same PR.
- If an item is decided to never be fixed, keep the entry and mark `**Resolution:** wontfix` with the reason.
- "When in doubt, add it." Shallow entries are fine. Missing entries are not.

## Priority legend

- **[BLOCK]** — broken code that will crash or corrupt data in production. Fix before launch.
- **[SCOPE]** — violates `FEATURES.md` scope. Remove before launch unless scope formally changes.
- **[MVP-OK]** — intentionally unhandled for MVP; documented trade-off; ship as-is.
- **[V2]** — punted to post-MVP roadmap; not urgent.
- **[DEBT]** — quality debt (types, lint, indirection). Revisit opportunistically.
- **[RESOLVED]** — fixed; kept as a record of the decision so it isn't re-debated.

---

## Feature 1 — Account + Profile

### email-verification-deferred

**Priority:** BLOCK (pre-launch — before any uncontrolled signup / public beta)
**Where in code:**
- `FEATURES.md` §1 — "Email verification required before civic actions (calling, following bills)"
- `app/api/calls/route.ts`, `app/api/scripts/route.ts` — civic-action mutations, currently session-gated only (no verification check)
- Supabase project `tnopzkpufusdqukmkplt` (BTC) — Auth → "Confirm email" toggle

**Situation:** Feature 1's "email verification before civic actions" requirement is **consciously NOT met for MVP** (decision 2026-05-22). Verified empirically against the live project:
- **"Confirm email" is OFF (auto-confirm ON).** Public `auth.signUp` returns a session immediately with `email_confirmed_at` stamped at signup and no confirmation email sent. So `auth.users.email_confirmed_at` is **true for every user** and proves nothing about email ownership.
- `profiles.email_verified_at` is **true for no user** (never written; 0/N populated) — see `email-verified-at-dead-column`.
- Net: **no proof-of-email-ownership exists anywhere in the system.** Anyone can sign up with an address they don't control and immediately use every civic action.

**Why deferring is acceptable now:** accounts are operator-created/controlled through the demo phase, and the abuse/cost vector (unverified accounts burning Anthropic budget) is already capped by the Anthropic prepaid credit balance (auto-reload OFF — no postpaid daily limit exists on this account type). Verification is not demo-critical.

**Must be resolved before any uncontrolled signup / public beta.** Two viable paths, teed up so the decision isn't re-derived:
1. **Flip "Confirm email" ON** (Supabase dashboard) — near-zero work. Native verification enforced at the login boundary: unverified users can't obtain a session at all, so they can't reach any civic action. Stricter than the "browse-then-gate" wording (users can't do anything until verified), which is fine/better for MVP. Once ON, `auth.users.email_confirmed_at` becomes a real signal and any action-level gate is optional belt-and-suspenders.
2. **Custom Resend token flow** — only if "let unverified users explore, gate just the civic actions" is a wanted UX. Keep Confirm-email OFF (session at signup), send an ownership token via Resend, set a real `profiles.email_verified_at` on click, and gate `/api/calls` (+ optionally `/api/scripts`) on that column. Real feature build; partly reinvents Supabase's native confirmation.

**Probe note:** to check the toggle, use the public `auth.signUp` path, NOT `admin.auth.admin.createUser` — GoTrue rejects login for any `email_confirmed_at = null` user regardless of the toggle, so the admin path gives a false "ON" reading.

---

### email-verified-at-dead-column

**Priority:** DEBT
**Where in code:** `profiles.email_verified_at` (migration 002); `SCHEMA.md` §`profiles`

`profiles.email_verified_at` exists as a nullable column but is **never written** (0/N rows populated — confirmed by query). It reads like a gate-able "is this user verified" signal but isn't one — a future dev could gate on it and 403 every real user. Authoritative verification (once it exists) lives on `auth.users.email_confirmed_at`, not here. See `email-verification-deferred`.

**Resolve when email verification is built (one of):**
- **Backfill + populate:** if the custom flow (path 2 above) is chosen, this becomes the real signal — backfill existing confirmed users and write it on verify.
- **Remove:** if Confirm-email ON (path 1) is chosen, `auth.users.email_confirmed_at` is sufficient — drop this column in a migration to kill the trap.

Until then it is a dead field that looks load-bearing. **Do not gate on it.**

---

### signup-check-email-dead-branch

**Priority:** DEBT
**Where in code:** `app/(auth)/signup/page.tsx` — the `if (data.session) … else { setCheckEmail(true) }` branch + the `checkEmail` "Check your email" screen

Under the current auto-confirm config, `auth.signUp` always returns a session, so `data.session` is always truthy and the `else` branch (the "📬 Check your email" confirmation screen) is **unreachable dead code**. It only comes alive if "Confirm email" is turned ON (path 1 of `email-verification-deferred`). Harmless today; flagged so it isn't mistaken for working verification UX, and so it's revisited when the verification gap is closed.

---

## Feature 2 — Federal Representative Lookup

### feature-2-vacant-seats

**Priority:** MVP-OK
**Where in code:**
- `lib/congress.ts` — `getHouseMemberByDistrict` returns `null`; `getSenatorsByState` returns 0–2 results
- Server action (pending, `lib/server-actions/sync-reps.ts` or similar)
- `app/(app)/representatives/page.tsx` — needs a "Seat currently vacant" placeholder card
- `representatives.dc_office_phone` is `NOT NULL` — enforces skip-insert policy

**Situation:** Mid-cycle vacancies (member died, resigned, expelled; pending special election; newly sworn-in with Congress.gov profile not yet synced) cause Congress.gov to return null/empty/partial results with `currentMember=true`.

**MVP policy:** Skip-insert. If we don't have a full rep profile (including a DC office phone), we don't create a `user_representatives` link. The UI fills the gap with a neutral "Seat currently vacant — check Congress.gov" card.

**V2 candidates:**
- "Report this rep is wrong" button that bypasses the refresh throttle
- Weekly cron that re-syncs users whose stored reps have since changed status
- Relax `dc_office_phone` to nullable + render "contact via website only" for partial profiles

---

### feature-2-senate-seniority-tiebreak

**Priority:** MVP-OK
**Where in code:** `lib/congress.ts` → `compareSenatorSeniority`

Senate seniority is ranked by earliest Senate-only `startYear`. Ties (same swear-in year) are broken alphabetically by `lastName`. This is deterministic and stable but arbitrary — other orderings (state-specific tradition, official precedence list) are cleaner but require data Congress.gov doesn't expose.

**Not changing in MVP.** Documented in code.

---

### feature-2-senate-chamber-filter

**Priority:** MVP-OK (fragile assumption)
**Where in code:** `lib/congress.ts` → `getSenatorsByState`

Filter checks `terms.item[0].chamber === 'Senate'` on the list response. Assumes Congress.gov returns current-congress terms first. A current senator who previously served in the House could theoretically be excluded if the API returns oldest-term-first. Rare in modern politics (House→Senate is the common path), but worth revisiting if we see real-world senator-count mismatches in beta.

**V2 option:** Switch to checking `terms.item.some(t => t.chamber === 'Senate')` after validating against live data, OR make a detail call for every list result (more API calls but unambiguous).

---

### feature-2-jan-cutover-edge

**Priority:** RESOLVED
**Where in code:** `lib/congress.ts` → `currentCongress`

The 20th Amendment makes new Congresses convene Jan 3 of odd years. Naive `floor((year - 1789)/2) + 1` returns the incoming Congress number on Jan 1–2 of odd years, before it's actually seated. Now explicitly handled. Kept in this file so the decision isn't re-debated.

---

### feature-2-refresh-window

**Priority:** V2
**Where in code:** `profiles.reps_last_refreshed_at`; server action checks 7-day window

A user who signs up during a vacancy and gets a special-election result two days later won't see the new rep for 5 more days. Acceptable for MVP volume; annoying at scale.

**V2 proposal:** In-UI "These reps don't look right" button that bypasses throttle. Or auto-invalidate when stored state includes a vacancy.

---

### feature-2-congress-sync-lag

**Priority:** MVP-OK (external)

Congress.gov itself lags hours-to-days between a new member's swearing-in and profile availability. Out of our control. Documented so nobody misdiagnoses it as our bug.

---

### feature-2-partyhistory-empty

**Priority:** MVP-OK
**Where in code:** Server action (pending)

Theoretical risk that `partyHistory` is empty on a brand-new member before Congress.gov fills it in. Server action will use `.at(-1)?.partyAbbreviation` and skip-insert on missing — no crash, treats as vacancy.

---

## Feature 3 — Bill Feed

### feature-3-backfill-119th-congress

**Priority:** MVP-OK (deferred from Phase 2; needs to run before first donor demo)
**Where in code:** to live at `scripts/backfill-bills.ts` (does not exist yet)

The Phase 2 cron rewrite is incremental — it pulls only bills updated since `sync_state.last_successful_sync_at - 48h`. That keeps cron runs cheap, but it means a freshly-applied production database has an empty `bills` table until enough Congress.gov activity accumulates, and less-active issue tags (e.g. `gun_safety`) may never accumulate enough hits for the personalized feed to feel populated.

A one-shot backfill script paginates `/bill?congress=119` and pulls every bill in the active Congress, chunked to respect the 5,000/hour Congress.gov quota. Idempotent via `bills.full_identifier` upsert, so it can be re-run safely.

**Why script and not admin route:** runs once, takes too long for a 60s Vercel function, and the cost ceiling is local laptop runtime not a serverless invocation timer. Live in `scripts/backfill-bills.ts`, invoked with `tsx scripts/backfill-bills.ts` (or similar) using `SUPABASE_SERVICE_ROLE_KEY` and `CONGRESS_API_KEY` from `.env.local`.

**Trigger to build it:** before the first donor demo, or whenever a beta tester reports an empty feed for a non-trending issue tag.

---

### local-supabase-stack

**Priority:** Low (DEBT)
**Where in code:** Local dev tooling — `supabase db reset` requires Docker Desktop, which isn't installed on this machine.

`supabase db reset` brings up the full local Supabase stack (Postgres, GoTrue, PostgREST, Storage, etc.) in containers and replays every migration in order against a fresh DB. It's the only way to validate a migration against a clean schema without paying the cost of a remote `supabase db push`. We currently push migrations straight to the linked remote project (the pattern used for migrations 001–005); the 006 push followed the same path.

That's fine for additive migrations. It is not fine for destructive ones — column drops, constraint tightening on existing data, or anything where a forward-only migration could leave production unbootable if the SQL has a typo. For those, validating locally first is cheap insurance.

**Trigger to install:** before any destructive migration (column drops, NOT NULL on existing rows, CHECK constraint changes, RLS rewrites that affect already-applied policies). Until then, push-and-verify-via-MCP is acceptable for additive work.

**What "install" means here:** Docker Desktop for macOS + `supabase init` to scaffold `config.toml` (currently absent — the migrations directory is the only thing under `supabase/`).

---

### substance-filter-introduced-bills

**Priority:** V1.1 (product calibration)
**Where in code:** `lib/congress.ts` — `deriveDisplayStatus` is what surfaces a bill as `'introduced'` for its first 7 days. The substance signals discussed below would feed into either a feed-side filter or a separate "introduced-but-noteworthy" UI affordance.

The 7-day display window from `deriveDisplayStatus` (Phase 3a refactor) means the feed will show every bill in its first week — including procedural noise like sponsor swaps ("ASSUMING FIRST SPONSORSHIP"), introductory-remark entries, and bills that will never move. The first live sync's `mapStatusFromAction` warn output documented dozens of distinct procedural-text patterns inside a 24-hour window: most bills introduced in any given week are not substantive in the sense a user cares about.

The product question for v1.1 is: **how do we keep the introduced-display window from being dominated by procedural noise without hiding genuinely substantive bills that haven't yet had committee action?**

**Candidate substance signals to combine:**
- Cosponsor count threshold (e.g. ≥10 cosponsors → likely substantive)
- Sponsor seniority / role (committee chair, ranking member, leadership → higher prior on substance)
- AI substance classifier on title + summary (Claude call gated by daily cost cap, similar to the script-generation pattern)
- Keyword-density heuristic against the issue taxonomy (`lib/interests.ts`) — bills whose title hits multiple high-signal keywords are likely substantive
- Any combination, tuned against beta complaints

**Possible product shapes once a signal is chosen:**
- Filter `'introduced'`-display bills below a substance threshold out of the personalized feed entirely.
- Surface them in a secondary "Recently introduced" section beneath the main feed, ordered by substance score.
- Surface all of them but de-rank — keep the existing feed sort and let urgency win against introduced-display urgency naturally.

**Cross-link:** time-based status decision in `STRATEGY.md` §11.

**Trigger to revisit:** beta feedback of the form "I'm following Issue X but the feed is full of nothing" or "There's a major bill on Issue X that's not showing up." Either signal — too much noise, or substantive bills missing — is evidence that we need to engage with the substance question rather than rely on the blanket time-based window.

---

### feature-3-prewarm-demo-bills

**Priority:** MVP-OK (demo accelerant built; the real ai_summary pipeline is still deferred)
**Where in code:** `scripts/prewarm-bills.ts` (exists as of 2026-05-31)

**Reality check (2026-05-31):** the original entry assumed `ai_summary`/`issue_analysis` are "generated lazily on first detail-page view (Feature 4)" and that a pre-warm script would "run the same generation pipeline as the lazy path." Verified false during the bill-summary work: **no lazy/sync ai_summary generation was ever built** — `ai_summary` is read in three places and written nowhere (`lib/congress.ts` hardcodes `summary_text: null` and defers `ai_summary` to "Phase 3b/4"). The Decoded hero therefore renders empty on all 482 real bills.

**What `scripts/prewarm-bills.ts` is:** a DESIGN/DEMO accelerant, not the product mechanism. It generates a plain-language summary from each bill's **full text** (Congress.gov `/text`, Sonnet) for a bounded curated sample, and writes straight to `bills.ai_summary` via the service role. It does NOT route through `script_generations` (keyed `(user_id, bill_id, stance)` — a summary has neither). Idempotent (skips rows already summarized). `issue_analysis` stays deferred and untouched — no surface reads it.

**Still deferred — the real pipeline:** the spec'd lazy-on-view (or sync-time) `ai_summary` generation in FEATURES.md §4. When built it **must be cache-first** — skip generation when `ai_summary` is already set — so these pre-filled rows read as cache hits rather than being regenerated and re-billed.

**Why script and not admin route:**
- No public surface area = no auth/CSRF/rate-limit concerns.
- Runs from your laptop before a demo, no redeploy cycle.
- Iteration cost is your laptop time, not serverless invocation cost.

**Trigger to build the real pipeline:** before relying on `ai_summary` for bills outside the pre-warmed sample (broad demo or public launch).

---

## Status & Urgency Calibration (v1.1)

### urgency-score-display-status-mismatch

**Priority:** V1.1 (calibration debt)
**Where in code:**
- `lib/congress.ts` — `computeUrgencyScore` is called inside `mapDetailToBill` against the stored `BillStatus` at sync time.
- `lib/congress.ts` — `deriveDisplayStatus` returns the read-time display status (introduced for the first 7 days).

`computeUrgencyScore` runs at sync time against the stored status, which means a bill in its first 7 days is scored against `'committee'` (~0.45) while users see it displayed as `'introduced'`. The Phase 2 STRATEGY note already flagged the urgency weights as uncalibrated for v1.1; this is the same calibration debt now made visible by the time-based display split.

**Decision (2026-05-01, see `STRATEGY.md` §11): option (b) below — accept the divergence for v1.1.**

The urgency weights are uncalibrated for v1.1 anyway per the Phase 2 STRATEGY note. Polishing one component (status-tier mapping) when the underlying weights are themselves uncalibrated would be premature optimization. The mismatch will be reconciled as part of the full urgency calibration pass, not as a one-off.

**Chosen for v1.1 — option (b): accept divergence.**
Bills in their first 7 days display as `'introduced'` but rank against the `'committee'` urgency tier (~0.45) in the feed sort. Display status and sort weight don't agree, but neither does anything else in the urgency model right now. Cheaper, less semantically clean, defensible until calibration.

**Alternative (deferred to the urgency calibration pass) — option (a): recompute urgency at read-time** alongside `deriveDisplayStatus`, so display status and urgency tier always match. Costs a per-row computation on every feed query but keeps the contract crisp. Revisit when the calibration pass happens; if the calibration pass concludes that `'introduced'` wants its own urgency tier, this is the implementation path.

A second alternative also rejected at decision time: add an `'introduced'` urgency tier to `computeUrgencyScore` and write at sync time. Requires a migration to update existing rows and tightly couples the display-state and storage layers; less attractive than (a) when the calibration pass eventually engages.

**Cross-link:** time-based status decision and this v1.1 choice in `STRATEGY.md` §11.

---

## Broken code discovered during pre-Feature-2 sweep

These files were already in the codebase when Feature 2 work began. They were broken before any of my changes. Surfaced here for a clean cleanup decision before launch.

### schema-drift-bill-detail-and-card

**Priority:** RESOLVED (2026-05-21)
**Where in code:** ~~`app/(app)/bills/[id]/page.tsx`~~, ~~`components/BillCard.tsx`~~

Same pattern as `schema-drift-sync-bills` — the bill detail page and the `BillCard` component were both written against the pre-002 bills schema. References to `summary`, `level`, `state_code`, `vote_date`, `last_action`, `full_text_url`, and `tags` survived migration 002. Visible symptoms before the fix: "🏛️ undefined" badges across the feed (level fall-through), missing Congress.gov summary text (only `ai_summary` was rendered), no "Last action" line on detail, no "Full text →" link.

Mapped to canonical columns (`summary_text`, `last_action_text` + `last_action_date`, `congress_gov_url`, `issue_tags`); deleted `level`, `state_code`, `vote_date` outright since they don't exist on the canonical schema and the project is federal-only by scope. Federal badge is now hardcoded in both files with a one-line scope reference. Covered by `tests/bills.spec.ts` to prevent regression.

---

### feature-3-bill-number-missing-from-feed-rpcs

**Priority:** DEBT
**Where in code:**
- `components/BillCard.tsx` — renders `{bill.bill_number}` in the card header
- `supabase/migrations/006_feature3_bill_feed.sql` — `get_default_feed` and `get_personalized_feed` return columns do NOT include `bill_number`

`bills.bill_number` is `int NOT NULL`, but the feed RPCs return only `full_identifier` (e.g. `hr-1234-119`). `BillCard` reads `bill.bill_number` and renders empty in the live feed. The bill detail page is unaffected — it uses `.from('bills').select('*')` which returns `bill_number`.

**Fix options (v1.1 hygiene pass):**
1. Add `bill_number` to the RPC return columns in a new migration.
2. Switch `BillCard`'s identifier slot to `full_identifier`, which is also the more "official" form Congress.gov uses publicly.

(2) is the smaller change and probably the better UX (most users recognize "HR 1234 (119th)" over a bare `1234`).

---

### schema-drift-sync-bills

**Priority:** BLOCK (neutralized in production via cron disable; still a latent bug)
**Where in code:**
- `app/api/admin/sync-bills/route.ts`
- `app/api/cron/sync-bills/route.ts`
- `vercel.json` — cron entry was removed on 2026-04-24 (see `callflow-bills-detail` below)

Both routes upsert into `bills` with columns `synced_at`, `tags`, `external_id` and `onConflict: 'external_id'`. Migration 002 renamed these to `last_synced_at`, `issue_tags`, `full_identifier`. See `docs/solutions/schema-alignment.md`. Any invocation fails at the DB layer.

**2026-04-24:** The cron entry in `vercel.json` was emptied to stop daily production failures. Re-enable when the route is rewritten during Feature 3 (Bill Feed).

---

### schema-drift-call-logs

**Priority:** RESOLVED (2026-05-21)
**Where in code:** ~~`app/api/calls/route.ts`~~

Pre-Feature-5 route inserted into a non-existent `call_logs` table with drifted columns (`script_id`, `script_type`, `status`, `call_date`) and a legacy initiate/complete state machine. Rewritten in Feature 5 against canonical `call_events`: single POST `{ billId, representativeId, scriptGenerationId? }`, UUID validation, optional+nullable `scriptGenerationId` with an ownership check against `user_id` before linking. Freemium gating was already removed (see `freemium-lib-remnant`). The inline call surface (CallFlow) is wired back onto the bill detail page — see the now-resolved `callflow-bills-detail`.

---

### schema-drift-scripts

**Priority:** RESOLVED (2026-05-21)
**Where in code:** ~~`app/api/scripts/route.ts`~~

Pre-Feature-4 route queried a non-existent `scripts` table with non-canonical columns (`script_type`, `representative_id`). Rewritten in Feature 4 against `script_generations` per SCHEMA.md: cache-first lookup by `(user_id, bill_id, stance)`, persist `prompt_hash`, `model`, `input_tokens`, `output_tokens`, `cost_usd`. Stance enum aligned to the canonical `'support'|'oppose'|'undecided'` (was `'concerned'`).

---

### feature-4-rep-personalization

**Priority:** V2
**Where in code:**
- `lib/anthropic.ts` — `buildUserPrompt` instructs the model to address the recipient as a generic "Representative" rather than by name
- `app/api/scripts/route.ts` — does not load the user's representatives at all
- SCHEMA.md / migration 002 — `script_generations` UNIQUE constraint is `(user_id, bill_id, stance)` with no rep dimension

FEATURES.md §4 specifies the script should be "personalized with: user's values, stance on the bill, bill summary, **rep's name and party**." The canonical `script_generations` cache key has no rep dimension, so the script body must be rep-agnostic — otherwise the same cached row would be served for a House call and a Senate call with the wrong rep's name baked in.

**MVP behavior:** the generated script uses a generic "Representative" salutation, and the user fills in the actual rep's name in the editable textarea before the call. This is exactly what the "Save & Review" step is for.

**Trade-off:** A user calling their House rep and one of their Senators sees the same script body twice (one cache row). The personalization the user gets is real (values, interests, stance, bill), but rep-specific tailoring is shifted to the human edit step rather than the model.

**V2 path (if/when this becomes load-bearing):**
- Add `representative_id uuid` to `script_generations` and migrate the UNIQUE constraint to `(user_id, bill_id, stance, representative_id)`.
- Update `/api/scripts` to require `representativeId` in the request body and load the rep's name + party + chamber for prompt construction.
- Update `lib/anthropic.ts` to include rep fields in `ScriptRequest` and drop the "address as Representative generically" instruction.

**Trigger to revisit:** beta feedback indicating the rep-agnostic body feels generic, or a donor demo where the editable-name step is awkward on stage.

---

### dead-civic-classes

**Priority:** RESOLVED (2026-05-22)
**Where in code:** ~~`civic-*` class references across 13 files~~ — now `ink`-family tokens.

**Situation (historical):** `tailwind.config.ts` defines the design palette as `ink / signal / paper / divider / graphite / moss / amber / oxblood`. There was no `civic-*` color extension anywhere — not in the Tailwind config, not in `app/globals.css`, not in any CSS variables. Tailwind silently drops unknown utility classes at build time, so every `civic-*` reference rendered as a no-op: no background color, no text color, no border. The pages still rendered because surrounding utilities (`text-slate-X`, `bg-white`, `border-slate-200`) carried the styling — those survive because `theme.extend` *merges* with Tailwind's defaults, whereas `civic-*` was never added — but the *intended accent color* was missing across the entire app.

Discovered while scoping Feature 4 (the instruction "use existing design tokens (civic-600 etc.)" turned out to reference a non-existent token). Feature 4/5 code (`ScriptFlow`, `CallFlow`, bill detail) already used the real `ink/signal/paper` tokens via the Button variants.

**Resolution (option 1 — mechanical remap to `ink`):** All 64 `civic-*` occurrences across 13 files replaced 1:1 with the `ink` family — the dominant accent in the locked system (links/ghost buttons, primary fills, focus rings, and selected borders are all `ink` in `button.tsx` / `ScriptFlow` / `CallFlow`; `signal` is reserved for the single loud CTA). Mapping:

| `civic-*` | → | real token |
|---|---|---|
| `text-civic-{600,700,800,900}` | → | `text-ink` |
| `bg-civic-600` | → | `bg-ink` |
| `bg-civic-300` | → | `bg-ink-20` |
| `bg-civic-50` | → | `bg-ink-10` |
| `border-civic-600` | → | `border-ink` |
| `border-civic-{300,400}` (card / toggle hover) | → | `border-divider-strong` |
| `border-civic-200` | → | `border-ink-20` |
| `ring-civic-600` (input focus) | → | `ring-ink` |

No `signal` introduced — the wordmark / hero / stat color-pops were restored to neutral `ink` and the brand decision deferred to `brand-accent-color-pops` below. The original entry listed `components/CallFlow.tsx` as affected, but that component was fully rewritten in Feature 5 and no longer contained `civic-*`; the entry's shade list also omitted `civic-900` (found in onboarding). The actual edited set was 13 files: landing, dashboard, onboarding, representatives, settings, bill detail, the four auth pages, `BillCard`, `ImpactMetrics`, `NavBar`.

---

### brand-accent-color-pops

**Priority:** V2 (brand-lock)
**Where in code:**
- `app/page.tsx` — hero accent span ("Make it heard.") and the four landing stat figures (`100%` / `3 levels` / `50 states` / `< 5 min`)
- "Oravan" wordmark logotype — every page header + footer (`app/page.tsx`, `components/NavBar.tsx`, the auth pages, onboarding)

Hero accent span, wordmark logotype, and landing stat figures were `civic-600` color-pops, restored to neutral `ink` pending brand lock; revisit whether the logotype / hero / stats should carry a brand accent (`signal` or otherwise) when the name + visual identity are decided. Mapping these to `ink` keeps them legible and on-system, but at these specific spots it effectively removes the accent rather than restoring it — which is exactly why the original intent is a brand-identity call, deliberately kept out of the mechanical cleanup PR (see `dead-civic-classes`).

**Trigger to revisit:** brand lock (name + visual identity), or the first donor demo if the headers/hero feel flat without an accent.

---

### freemium-lib-remnant

**Priority:** RESOLVED (2026-04-24)
**Where in code:** ~~`lib/freemium.ts`~~ (deleted), `app/api/calls/route.ts` (import and usages removed)

`FEATURES.md`: "No Stripe. No paid tiers. No 'pro' features." Deleted the lib and removed the `getDailyCallCount` import, `canCall` gating, `DAILY_LIMIT_REACHED` response, and `upgradeUrl: '/upgrade'` from the calls route. The call-count-in-response payloads (GET handler, and the `callCount` field on POST responses) were removed along with the gating — no remaining freemium surface.

---

### callflow-bills-detail

**Priority:** RESOLVED (2026-05-21) — inline script + call flow rebuilt on the bill detail page
**Where in code:** `app/(app)/bills/[id]/page.tsx`, `components/ScriptFlow.tsx`, `components/CallFlow.tsx`

`<CallFlow>` was removed from the bill detail page during the Feature 2 UI rewrite because it depended on two broken routes (`/api/scripts`, `/api/calls`), and was temporarily replaced with a "See my representatives" link. With Features 4 and 5 shipped, both routes are rewritten against canonical schema and the inline flow is rebuilt: `ScriptFlow` (stance → generate → Save & Review) lifts saved-state + script id to the bill page, which then renders `CallFlow` (rep cards → tap-to-call → self-report). `components/CallFlow.tsx` was fully rewritten — the old version is gone.

---

## Type safety & lint debt

### untyped-browser-supabase-client

**Priority:** DEBT (broad — affects every client-side query)
**Where in code:** `lib/supabase/client.ts`

`createClient()` returns `createBrowserClient(url, key)` but falls back to `null as any` when env vars are missing. Because one branch is `any`, the function's inferred return type collapses to `any` — so **every client-side Supabase query in the app is unchecked at compile time**. Table names, column names, filter shapes, and result types are all unverified; typos and schema drift only surface at runtime.

This surfaced during Feature 5: `CallFlow` tried to mirror `loadLinkedReps` (server side) with `.returns<LinkedRepRow[]>()`, but a generic call can't be applied to an `any` chain (TS2347 "Untyped function calls may not accept type arguments"). The workaround was to assign the `any` result to a typed local — fine locally, but it's a symptom of the whole client being untyped.

The server client (`lib/supabase/server.ts`) is properly typed with the generated `Database` types, which is why `loadLinkedReps` gets `.returns<>()` and full inference. The browser client should be typed the same way:
- `createBrowserClient<Database>(url, key)` with the generated types.
- Replace the `null as any` fallback with a typed nullable (`SupabaseClient<Database> | null`) and have callers handle null, or throw — see the related `any-casts` note on `client.ts:6`.

**Trigger to fix:** v1.1 type-safety hygiene pass, or sooner if a client-side query bug ships that compile-time types would have caught. Related: `any-casts`.

---

### any-casts

**Priority:** DEBT
**Where in code:**
- `app/(app)/bills/page.tsx:63` and `app/(app)/dashboard/page.tsx:149` — `bills.map((bill: any) => …)` should use a typed Bill interface
- `app/(app)/settings/page.tsx:47` — `interests.map((i: any) => …)`
- `app/(app)/representatives/page.tsx:68` and `app/api/admin/sync-bills/route.ts:39` — `catch (err: any)` should use `unknown` + narrow
- `lib/supabase/client.ts:6` — `return null as any` when env vars missing; should throw or return a typed nullable

None are `@ts-ignore` violations individually, but collectively they erode type safety. Knock out in a v1.1 hygiene pass.

---

### eslint-flat-config-migration

**Priority:** DEBT
**Where in code:** `.eslintrc.json`, `package.json` lint script

`next lint` was removed in Next.js 16. The lint script now calls ESLint directly (`eslint . --ext .ts,.tsx`) with `ESLINT_USE_FLAT_CONFIG=false` to keep the legacy `.eslintrc.json` working. ESLint 10 will drop legacy config support entirely. Migrate `.eslintrc.json` to `eslint.config.mjs` before upgrading ESLint past v9. The `eslint-config-next` package should have a flat config export by then.

---

### exhaustive-deps-disables

**Priority:** DEBT
**Where in code:**
- `app/(app)/representatives/page.tsx:48`
- `app/(app)/settings/page.tsx:54`
- `app/(app)/bills/[id]/page.tsx:86`

Each disables `react-hooks/exhaustive-deps` for an effect that likely depends on `supabase` or a fetcher. Revisit when converting pages to Server Components, which would eliminate the question entirely.

---

## UX polish punted

### onboarding-skip-not-gated

**Priority:** Product decision (needs your call before fixing)
**Where in code:**
- `app/(app)/onboarding/page.tsx:226` — always-visible "Just let me make a call — skip for now" button calls `router.push('/dashboard')` with no profile update
- `app/(app)/layout.tsx:15–19` — selects `onboarding_completed_at` from `profiles` but only uses it for the userName display; never redirects on null

**Situation:** A new user can sign up, hit the onboarding location step, click Skip, and land on the dashboard with no address, no district, no `user_representatives` rows, and no interests. From there they can navigate freely to `/bills`, open any bill, and reach any feature surface — they're authenticated, just not onboarded. The skip path is intentional product copy ("Just let me make a call — skip for now") but no part of the app handles the consequences in a coordinated way today.

**Surfaced during Feature 5 scoping.** CallFlow's 0-reps state was originally framed as an edge case for vacant-seat scenarios. After auditing the onboarding flow, it's actually a first-class path any skip-user takes. Feature 5 handles it locally with an "Add my address" CTA pointing at `/representatives`, but the question scales:

- Should `/bills` nudge skip-users to complete onboarding?
- Should ScriptFlow refuse to generate without a profile (or generate with degraded personalization)?
- Should the layout soft-gate by redirecting `onboarding_completed_at IS NULL` users to a "finish setup" surface?
- Or is the skip path supposed to be permissive — let users explore, prompt for setup only at the action moment?

**This is a product decision, not a code one.** Each surface (feed, script, call) currently treats incomplete profiles differently or not at all. A coherent policy needs to be decided before further surfaces are built. Until then, each new feature handles its own degraded path locally.

**Trigger to decide:** before any user-facing pre-launch or donor demo. The current behavior is technically correct (no crashes, no missing data errors), but a skip-user opening a bill sees inconsistent surfaces — Feature 4 generates a generic script regardless of profile completeness, Feature 5 will show "Add my address" with a clear CTA. That inconsistency is the smell.

---

### dashboard-timezone

**Priority:** V2
**Where in code:** `app/(app)/dashboard/page.tsx:55` (already commented)

"Calls today" counts by UTC midnight. California user calling at 6pm PST sees it on the next UTC day. Requires per-user timezone in `profiles` to fix properly.

---

### reset-password-expired-session

**Priority:** V2
**Where in code:** `app/(auth)/reset-password/page.tsx:32` (already commented)

Expired recovery links surface raw Supabase errors. Replace with friendly "request a new link" state.

---

### forgot-password-rate-limit

**Priority:** V2
**Where in code:** `app/(auth)/forgot-password/page.tsx:31` (already commented)

Map Supabase `over_email_send_rate_limit` to friendlier message.

---

### impact-metrics-no-freemium

**Priority:** RESOLVED (but see freemium-lib-remnant)
**Where in code:** `components/ImpactMetrics.tsx:3`

Standing comment warns against re-adding `isPremium`/freemium gating. This is fine for the component; the lib and route still need cleanup (see above).

---

## Supabase advisor lints (pre-existing)

### auth-trigger-and-leaked-password-lints

**Priority:** DEBT
**Where in code:**
- `supabase/migrations/002_align_to_schema.sql` — original `handle_new_user` definition
- `supabase/migrations/004_fix_profile_trigger_search_path.sql` — partial fix (qualified `public.profiles`)
- Supabase Auth dashboard — "Leaked Password Protection" toggle

Four WARN-level findings surfaced during the Phase 2 advisor diff. None are exploitable today; tracked here so they aren't rediscovered as "new" later.

1. **`function_search_path_mutable` on `handle_new_user`** — the trigger function lacks an explicit `SET search_path` clause. Migration 004 addressed the symptom (qualified `public.profiles` in the body) but didn't pin the function's own `search_path`. Advisor still flags it because the function definition is still mutable-by-default.
2. **Two `*_security_definer_function_executable` lints on `handle_new_user`** — flagged because it's `SECURITY DEFINER` and grantable to `public`. The trigger only fires on `auth.users` insert via the `on_auth_user_created` trigger and isn't reachable from RPC, so the practical risk is low, but tightening grants is best practice.
3. **`auth_leaked_password_protection`** — Supabase Auth dashboard setting that gates HIBP-checked passwords at signup. Off by default. No code change required to enable.

**Fix sketch (for the trigger):** add `SET search_path = public` to the `CREATE OR REPLACE FUNCTION handle_new_user()` body in a new migration; revoke `EXECUTE ... FROM public` and re-grant only to the postgres owner. Verify via `supabase db lint` afterward.

**Fix sketch (for leaked-password):** flip the toggle in the Supabase dashboard → Authentication → Policies. No migration needed.

**Trigger to fix:** Week 5 polish or beta hardening, not earlier. None of these block any MVP feature; surfacing them in a phase that's rewriting unrelated code (Phase 3a) would expand scope without payoff.

---

## Design system consolidation (Batch 1)

### type-scale-extension

**Priority:** Design (brand-locked design phase)
**Where in code:** `tailwind.config.ts` `fontSize` tokens; `app/globals.css` `.t-*` utilities. Surfaced during the Batch 1 Chunk 3 sweep.

The type scale (`display/h1/h2/h3/body/small/meta/mono` = 56/36/24/18/16/14/12-uppercase/13px) has **no token for several sizes the pages use**, so "raw size → type scale" could only convert exact matches (`text-base→body`, `text-sm→small`, `text-lg→h3`, `text-2xl→h2`, `text-4xl→h1`). Three gaps left as raw `text-*` pending a design decision:

- **12px non-uppercase** — `text-xs` (~26×) for captions / pill text; the only 12px token is `text-meta` (uppercase + tracked), which would change case. Same gap that blocked the `Badge` primitive (see `components/ui/README.md`).
- **20px** — `text-xl` (~5×); nothing between `h3` (18) and `h2` (24).
- **30px** — `text-3xl` (~6×); nothing between `h2` (24) and `h1` (36).
- **18px body** — `text-lg` on body *paragraphs* (e.g. the landing CTA subhead); the 18px token `text-h3` carries heading line-height (1.15), wrong for multi-line body copy. (`text-lg` on headings maps cleanly to `h3`.)

Resolve by extending the scale (e.g. a non-uppercase 12px `caption`, a 20px step, a 30px step) when brand + visual identity are locked, then convert the remaining raw sizes. Until then those raw `text-*` are intentional, not oversights.

---

### consolidation-followup-offscope-slate-and-semantic-colors

**Priority:** DEBT (consolidation follow-up — not in Chunk 3 scope)
**Where in code:**
- `slate-*` still present (31 occurrences) in: `app/(app)/bills/page.tsx`, `app/(app)/bills/[id]/page.tsx`, `components/ImpactMetrics.tsx`, `components/RepCard.tsx` (`app/(app)/layout.tsx` was pulled into the Batch 1 components/landing sub-chunk and swept — no longer deferred)
- off-palette `red-*` / `green-*` error/success banners (auth pages and elsewhere)

Batch 1 Chunk 3 swept only the listed surfaces (auth, onboarding, dashboard, settings, representatives, NavBar, BillCard, landing body). The files above keep raw `slate-*` and need the same `slate → ink/divider/paper` mapping in a follow-up for full coverage. Separately, error/success banners use Tailwind `red-*`/`green-*`; the system's semantic equivalents are `oxblood` (danger) and `moss` (success) with their `-10` tints — fold into the same follow-up. Neither was in the Chunk 3 instruction; logged so full coverage isn't forgotten.

---

### landing-features-grid-emoji

**Priority:** V2 (brand-lock)
**Where in code:** `app/page.tsx` — `FEATURES` array `icon` fields (📋 📞 ✍️ 🏆 📍 🔒), rendered in the landing features grid

Batch 1 converted in-scope emoji to lucide everywhere else but left the landing features-grid set. Only 📋/📞 were in the Chunk 3 emoji list; converting just those would orphan them in a six-icon grid, and converting all six needs icon-selection for ✍️/🏆/📍/🔒 — a visual-identity choice. **Deferred to brand-lock** — fold into the type-scale / landing design work, not a consolidation sweep. Convert the whole set to lucide (or the chosen icon system) when the landing visual identity is decided. Related: `brand-accent-color-pops`, `type-scale-extension`.

---

### landing-copy-out-of-scope-features

**Priority:** SCOPE
**Where in code:** `app/page.tsx` — `FEATURES` array copy + section text

The landing still advertises capabilities **out of MVP scope** (FEATURES.md): representatives "at every level: federal, **state, and local**" and "**City councils, mayors, school boards**" (state/local reps — v2), plus the "**Callenge your community** … commit to a number of calls with friends" card (social/gamification — v2). Same flavor as the "state & local / 50 states" stats copy already fixed (PR #17). Reword to federal-only and drop/defer the gamification card before any public or donor-facing launch. **Copy change, not styling** — separate ticket; surfaced during the Batch 1 landing sweep. **Also: the `Challenge` nav item in `NavBar.tsx`** (mobile bottom-tab + desktop sidebar, route `/callenge`) is the same out-of-MVP gamification — remove it from the nav alongside the landing card. Surfaced during the bill-detail floor session (2026-05-23); logged only, not acted on (shell paradigm itself is intentional and stays).

---

## Launch gates

### noindex-pre-launch

**Priority:** BLOCK before public launch
**Where in code:** `app/layout.tsx` — `metadata.robots`

Site-wide `robots: { index: false, follow: false }` added 2026-05-23 (Next renders `<meta name="robots" content="noindex, nofollow">` into every page head from this). The app is **live and openly reachable at oravan.org** for dev/demo, but is pre-launch with **formal trademark clearance still pending**, so it must stay out of search indexes. **Remove the `robots` block at public launch, after formal trademark clearance** — fold into the same gate as the nonprofit legal consult and `landing-copy-out-of-scope-features` (the other things that must be true before a public/donor launch).

---

### ai-disclaimer-decoded-hero

**Priority:** BLOCK (pre-public-launch — before any public or donor-facing exposure of the Decoded hero)
**Where in code:**
- `app/(app)/bills/[id]/page.tsx` slot 3 — the Decoded hero renders `bills.ai_summary` as neutral fact, with NO disclaimer
- `lib/anthropic.ts` `summarizeBill` / `scripts/prewarm-bills.ts` — generators of `ai_summary`
- Contrast: FEATURES.md §4 + `ScriptFlow` — the AI *script* surface carries the mandated "AI-drafted. Review and edit before use." disclaimer

**Situation:** FEATURES.md §4 mandates an "AI-drafted. Review and edit before use." disclaimer on generated call scripts — content the user reviews and speaks themselves. The Decoded hero shows `ai_summary` with **no disclaimer**, and it's arguably **higher-risk than the script**: it reads as a neutral, authoritative plain-English statement of what a bill does, not as user-authored text the user is expected to edit. An inaccurate or subtly-off summary reads as fact from the app.

**Required before public/donor launch:** a visible disclaimer on the Decoded hero, honest about both limits — incompleteness (truncation) and possible inaccuracy (generation): **"AI-generated summary — may be incomplete or inaccurate. Not an official source."** Deliberately does NOT promise verification against the official text — bills like `hr-1` were summarized from ~15k of 167k tokens, so a citizen cannot realistically verify against the full-text link; the disclaimer must not imply a workflow that doesn't exist.

**Design note:** the disclaimer's visual treatment must be folded **into the upcoming ceiling pass on the hero** — designed in from the start, sitting inside the warm/editorial treatment, not bolted on after. Add to the ceiling agenda (`docs/DESIGN_DECISIONS.md → Ceiling inputs`).

**Trigger to resolve:** before any public/donor-facing exposure of the Decoded hero — same gate as `noindex-pre-launch` and `email-verification-deferred`.

---

## Future feature ideas — bill detail (parked, post-MVP)

Surfaced during the bill-detail floor session (2026-05-23). **Not in MVP scope** — each needs a new data source or model. Captured as product ideas, not committed work. Both serve the same user-need the "Decoded" block targets: *"is this even worth my time?"*

### bill-progress-meter
A compact at-a-glance status indicator on `/bills/[id]` — almost a "battery meter" — showing:
- **How far along** the bill is in the process (could build on `deriveDisplayStatus` / `bills.status`)
- **Current odds of passing** (needs a prediction signal — external model or heuristic; no current data source)
- **How impactful** it would be (ties to `issue_analysis`)

### bill-impact-projections
A droppable container surfacing **official projections/studies** on the bill's effects — OMB/CBO-style cost-and-effect estimates — to clear the noise: *is this worth my time, who does it affect, what's the long-term picture if it passes.* Needs an external source (CBO/OMB) and a lazy-fill pattern like `issue_analysis`. Sits alongside the "Decoded" + "Why this matters to you" beats as the deeper-evidence layer.

---

## Change log

- 2026-05-23 — Pre-launch `noindex` added (`feat/oravan-wordmark-swap`, commit #2). Site-wide `metadata.robots = { index:false, follow:false }` in `app/layout.tsx`; oravan.org is live/reachable but kept out of search indexes until public launch + formal trademark clearance. Logged `noindex-pre-launch` (BLOCK-before-launch removal task).

- 2026-04-24 — Initial creation during Feature 2 sweep (Colby + Claude). Captured Feature 2 vacancy edges, four broken pre-existing routes, freemium lib remnant, type debt, three already-commented UX v2 items.
- 2026-04-28 — Feature 3 Phase 2 (migration + taxonomy lock). Added `feature-3-backfill-119th-congress` and `feature-3-prewarm-demo-bills` — both deferred from Phase 2 by explicit Phase 1 decision (logged in STRATEGY.md §11). Added `local-supabase-stack` — Docker Desktop + `supabase init` deferred until first destructive migration; additive migrations push-and-verify-via-MCP.
- 2026-04-28 — Feature 3 Phase 3a (cron + admin sync rewrite). Added `auth-trigger-and-leaked-password-lints` covering the four WARN-level Supabase advisor findings from the Phase 2 diff. Track-only in this phase; fix scheduled for Week 5 polish or beta hardening.
- 2026-04-30 — Feature 3 Phase 3a closeout. Added `substance-filter-introduced-bills` — the cron now blanket-skips `'introduced'`-status bills as MVP signal/noise control. V1.1 work to surface substantive introduced bills selectively.
- 2026-05-21 — Bill detail + BillCard schema-drift fix + first Playwright happy-path spec on the bill feed. Added `schema-drift-bill-detail-and-card` (RESOLVED) and `feature-3-bill-number-missing-from-feed-rpcs` (DEBT, surfaced during the sweep).
- 2026-05-21 — Feature 4 (AI call script) end-to-end. Marked `schema-drift-scripts` as RESOLVED, added `feature-4-rep-personalization` (V2; documents the cache-key trade-off) and `dead-civic-classes` (DEBT, high-visibility — surfaced during Feature 4 scoping when `civic-*` was confirmed undefined in the Tailwind config).
- 2026-05-21 — Feature 5 (1-click calling) end-to-end. Marked `schema-drift-call-logs` and `callflow-bills-detail` as RESOLVED (route rewritten against `call_events`; inline ScriptFlow + CallFlow rebuilt on the bill detail page). Added `onboarding-skip-not-gated` (product decision — skip-onboarding users reach feature surfaces with no address/reps; CallFlow handles the 0-reps case locally with a vacant-seat vs. add-address split).
- 2026-05-22 — Dead `civic-*` classes fixed (`fix/dead-civic-classes`). Marked `dead-civic-classes` RESOLVED — 64 occurrences across 13 files mechanically remapped to the `ink` family; corrected the stale `CallFlow.tsx` reference (rewritten in Feature 5, no longer contained `civic-*`) and the missing `civic-900` shade. Added `brand-accent-color-pops` (V2/brand-lock) capturing the wordmark/hero/stat color-pop decision — restored to neutral `ink`, no `signal` introduced under a cleanup PR.
- 2026-05-22 — Frontend design Batch 1 (system consolidation, `feat/design-system-consolidation`). Chunk 1: fonts → next/font + themeColor token. Chunk 2: Input/Card primitives. Chunk 3 sweep logged two deferred items: `type-scale-extension` (3 missing size tokens — sweep converts exact matches only, option A) and `consolidation-followup-offscope-slate-and-semantic-colors` (33 out-of-scope slate occurrences + off-palette red/green banners).
- 2026-05-23 — Batch 1 merged (PR #22): slate→token / size→type-scale / emoji→lucide sweep across 12 surfaces (slate 192→3, raw-size 131→46) + next/font + Input/Card primitives. Delisted `layout.tsx` from consolidation-followup (swept; now 31 slate), added the 18px-body gap to `type-scale-extension`, and logged `landing-features-grid-emoji` (V2/brand-lock) and `landing-copy-out-of-scope-features` (SCOPE — state/local + gamification still advertised on the landing). STATUS.md refreshed.
- 2026-05-22 — Landing stats overstating scope fixed (`fix/landing-stats-federal-scope`): removed the "state & local" / "50 states" claims, leaving a 3-stat federal-true strip.
- 2026-05-22 — Email verification consciously deferred to pre-launch (docs-only; no code shipped). Added the `## Feature 1` section: `email-verification-deferred` (BLOCK before public beta — "Confirm email" is OFF so `auth.users.email_confirmed_at` is true-for-all and `profiles.email_verified_at` is true-for-none; no proof-of-ownership exists), plus `email-verified-at-dead-column` and `signup-check-email-dead-branch` (DEBT gate-traps). `FEATURES.md` §1 annotated as deferred. Toggle state verified empirically via the public `auth.signUp` path (the `admin.createUser` path gives a false reading).
