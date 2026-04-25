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

## Broken code discovered during pre-Feature-2 sweep

These files were already in the codebase when Feature 2 work began. They were broken before any of my changes. Surfaced here for a clean cleanup decision before launch.

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

**Priority:** BLOCK
**Where in code:** `app/api/scripts/route.ts`

Queries a `scripts` table that does not exist (schema has `script_generations`). Also references `script_type` and `representative_id` — neither exists on `script_generations` per `SCHEMA.md`. Every call to this route crashes.

Feature 4 (AI Script Generation) is not yet built. This route may or may not be the right starting point for Feature 4 — decide when scoping Feature 4, and either rewrite to match the current schema or delete outright.

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

## Change log

- 2026-04-24 — Initial creation during Feature 2 sweep (Colby + Claude). Captured Feature 2 vacancy edges, four broken pre-existing routes, freemium lib remnant, type debt, three already-commented UX v2 items.
