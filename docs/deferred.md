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

**Priority:** MVP-OK (deferred from Phase 2; needs to run before each donor demo)
**Where in code:** to live at `scripts/prewarm-bills.ts` (does not exist yet)

`bills.ai_summary` and `bills.issue_analysis` are generated lazily on the first detail-page view (Feature 4). That's the right call for cost control — we don't pay Anthropic for bills nobody opens — but it produces an awkward "generating…" spinner during a donor demo where every "Open this bill" tap should feel instant.

A pre-warm script accepts a list of bill ids (CLI args or a `demo-bills.txt` file) and runs the same generation pipeline as the lazy path, just upserting the result. Caching is shared across all users, so once a demo bill is pre-warmed, every viewer gets the cached result.

**Why script and not admin route:**
- No public surface area = no auth/CSRF/rate-limit concerns.
- Runs from your laptop the morning of a demo, no redeploy cycle.
- Iteration cost is your laptop time, not serverless invocation cost.

**Trigger to build it:** before the first scheduled donor demo. Until then, the lazy path works for ad-hoc usage.

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

**Priority:** BLOCK
**Where in code:** `app/api/calls/route.ts`

Inserts into `call_logs` — schema is `call_events`. Column drift beyond just the table name (`script_id`, `script_type`, `status`, `call_date` — none exist on `call_events`). Every invocation fails at the DB layer.

**2026-04-24:** Freemium gating was removed from this route (see `freemium-lib-remnant`), but the schema drift remains. Feature 5 (1-Click Calling) will rewrite the route against `call_events` per SCHEMA.md.

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

**Priority:** DEBT (high — visible)
**Where in code:** Class-name references to `civic-50` / `civic-200` / `civic-300` / `civic-400` / `civic-600` / `civic-700` / `civic-800` across the app. Affected files:
- `app/page.tsx` (landing)
- `app/(app)/dashboard/page.tsx`
- `app/(app)/onboarding/page.tsx`
- `app/(app)/representatives/page.tsx`
- `app/(app)/settings/page.tsx`
- `app/(app)/bills/[id]/page.tsx`
- `app/(auth)/forgot-password/page.tsx`
- `app/(auth)/login/page.tsx`
- `app/(auth)/reset-password/page.tsx`
- `app/(auth)/signup/page.tsx`
- `components/BillCard.tsx`
- `components/CallFlow.tsx` (unused, but contains civic-* references)
- `components/ImpactMetrics.tsx`
- `components/NavBar.tsx`

**Situation:** `tailwind.config.ts` defines the design palette as `ink / signal / paper / divider / graphite / moss / amber / oxblood`. There is no `civic-*` color extension anywhere — not in the Tailwind config, not in `app/globals.css`, not in any CSS variables. Tailwind silently drops unknown utility classes at build time, so every `civic-*` reference renders as a no-op: no background color, no text color, no border. The pages still render because surrounding utilities (text-slate-X, bg-white, border-slate-200) carry the styling, but the *intended accent color* is missing across the entire app.

This was discovered while scoping Feature 4 — the user instructed "use existing design tokens (civic-600 etc.)" and verification showed `civic-*` is not an existing token. Feature 4 (ScriptFlow + bill detail page edits) uses the real `ink/signal/paper` tokens via the existing Button variants and matches the actual design system. New code does not introduce more `civic-*` references.

**Fix options:**
1. **Replace `civic-*` with `ink-*`/`signal-*` everywhere.** Closest to the apparent design intent (the Button variants already encode the system). Single mechanical PR.
2. **Define a `civic` palette in `tailwind.config.ts`.** Lights up all existing references at once. Requires picking colors — visual identity decision that the user has explicitly deferred ("don't invent new visual identity").
3. **Migrate to a CSS-variable-driven palette.** Bigger change; pairs with the v3→v4 Tailwind upgrade if/when that happens.

**Trigger to fix:** before the first donor demo, since "accent color missing" is a visible polish problem on every page. Option (1) is the cheapest path and aligns with the existing Button design tokens.

---

### freemium-lib-remnant

**Priority:** RESOLVED (2026-04-24)
**Where in code:** ~~`lib/freemium.ts`~~ (deleted), `app/api/calls/route.ts` (import and usages removed)

`FEATURES.md`: "No Stripe. No paid tiers. No 'pro' features." Deleted the lib and removed the `getDailyCallCount` import, `canCall` gating, `DAILY_LIMIT_REACHED` response, and `upgradeUrl: '/upgrade'` from the calls route. The call-count-in-response payloads (GET handler, and the `callCount` field on POST responses) were removed along with the gating — no remaining freemium surface.

---

### callflow-bills-detail

**Priority:** RESOLVED (2026-04-24) — inline call flow temporarily removed; restore when Features 4 & 5 ship
**Where in code:** `app/(app)/bills/[id]/page.tsx`, `components/CallFlow.tsx`

`<CallFlow>` was rendered on the bill detail page but depended on two broken routes (`/api/scripts`, `/api/calls`). The CallFlow import and render block were removed from the bill detail page during the Feature 2 UI rewrite. As of Task #6, the rep-selector UI on the bill detail page (which fetched the deleted `/api/representatives` stub and held dead `selectedRep` state) was also removed and replaced with a "See my representatives" link to `/representatives`. `components/CallFlow.tsx` remains in the codebase unchanged — it will be re-integrated once Features 4 and 5 rewrite the underlying routes; the inline rep + script + call flow on the bill detail page should be rebuilt then.

---

## Type safety & lint debt

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

## Change log

- 2026-04-24 — Initial creation during Feature 2 sweep (Colby + Claude). Captured Feature 2 vacancy edges, four broken pre-existing routes, freemium lib remnant, type debt, three already-commented UX v2 items.
- 2026-04-28 — Feature 3 Phase 2 (migration + taxonomy lock). Added `feature-3-backfill-119th-congress` and `feature-3-prewarm-demo-bills` — both deferred from Phase 2 by explicit Phase 1 decision (logged in STRATEGY.md §11). Added `local-supabase-stack` — Docker Desktop + `supabase init` deferred until first destructive migration; additive migrations push-and-verify-via-MCP.
- 2026-04-28 — Feature 3 Phase 3a (cron + admin sync rewrite). Added `auth-trigger-and-leaked-password-lints` covering the four WARN-level Supabase advisor findings from the Phase 2 diff. Track-only in this phase; fix scheduled for Week 5 polish or beta hardening.
- 2026-04-30 — Feature 3 Phase 3a closeout. Added `substance-filter-introduced-bills` — the cron now blanket-skips `'introduced'`-status bills as MVP signal/noise control. V1.1 work to surface substantive introduced bills selectively.
- 2026-05-21 — Bill detail + BillCard schema-drift fix + first Playwright happy-path spec on the bill feed. Added `schema-drift-bill-detail-and-card` (RESOLVED) and `feature-3-bill-number-missing-from-feed-rpcs` (DEBT, surfaced during the sweep).
- 2026-05-21 — Feature 4 (AI call script) end-to-end. Marked `schema-drift-scripts` as RESOLVED, added `feature-4-rep-personalization` (V2; documents the cache-key trade-off) and `dead-civic-classes` (DEBT, high-visibility — surfaced during Feature 4 scoping when `civic-*` was confirmed undefined in the Tailwind config).
