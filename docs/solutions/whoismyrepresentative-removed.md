---
name: whoismyrepresentative.com removed — do not reintroduce
description: Documents why lib/google-civic.ts (which actually called whoismyrepresentative.com) was deleted during Feature 2, and what replaced it
type: reference
---

## Context

Before Feature 2, `lib/google-civic.ts` existed but did **not** call Google Civic. Despite the filename, it fetched from `https://whoismyrepresentative.com/getall_mems.php?zip=...`. This was misleading and dead code — the route that consumed it (`app/api/representatives/route.ts`) also wrote to a `rep_lookup_cache` table that no migration ever created, so the stub threw at runtime on every request.

## Why it was removed

1. **Not an approved external service.** CLAUDE.md requires explicit permission before adding any third-party API. whoismyrepresentative.com was never approved.
2. **No SLA, no documentation, no contract.** It is a volunteer-maintained scraper. It has gone down for extended periods (notably an email outage in 2024). A civic-engagement MVP cannot hinge on a service with no uptime guarantee.
3. **ZIP-only resolution.** ZIP codes regularly span multiple congressional districts. Using ZIP alone was guaranteed to show wrong reps to a non-trivial fraction of users. Feature 2's acceptance criteria explicitly require full-address accuracy.
4. **Misleading filename.** Keeping a file named `google-civic.ts` that doesn't call Google Civic would mislead the next developer.

## What replaced it

- **Geocoding:** `lib/geocode.ts` → Google Civic **Divisions API** (the Representatives endpoint was shut down April 30, 2025 and must not be used). Returns `{ stateCode, district, ocdId, normalizedAddress }`.
- **Rep data:** `lib/congress.ts` gained `getHouseMemberByDistrict`, `getSenatorsByState`, and `getMemberDetail` functions hitting Congress.gov v3. Phone number lives only on the detail endpoint — the list endpoint requires a follow-up call per member.
- **Server flow:** A server action orchestrates geocode → Congress.gov → upsert into `representatives` → link via `user_representatives` with senior/junior ordering. Cache refresh is gated by `profiles.reps_last_refreshed_at` (7-day window unless the user changes address).

## If you are tempted to bring it back

Don't. If Google Civic Divisions ever fails us, the correct fallback is a paid geocoder (Census Geocoder is free and official, Mapbox/Google are paid) — not a scraper.
