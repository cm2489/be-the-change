# FEATURES.md

This file defines exactly what is and isn't in scope. When in doubt, the answer is "no, not this version."

**Product (since 2026-06-11):** the **Oravan Civic Action MCP** — a monetized remote MCP server + HTTP API for agent-native civic action. See `docs/PIVOT.md` for the strategy, rationale, and revenue expectations. The consumer web app is the **reference client**, not the product.

---

## MCP v1 Feature List

### F1. Steady-State Data Pipeline (prerequisite — the heartbeat)
**Acceptance criteria:**
- Nightly sync cron re-armed (`/api/cron/sync-bills`, `CRON_SECRET`-protected) and stable
- New/updated bills get `ai_summary`, `ai_headline`, and CRS-taxonomy tags **at sync time** (no more one-off backfill scripts as the write path)
- Per-run cost logged; hard ceiling enforced (prepaid Anthropic balance, auto-reload OFF)
- `sync_state` reflects health; a failed run is detectable from the DB and from the weekly digest
- Corpus freshness: no bill more than 48h behind Congress.gov on status/action

### F2. MCP Server — Core Tools
**Acceptance criteria:**
- Remote MCP server at `app/api/[transport]/route.ts` via Vercel `mcp-handler`, Streamable HTTP
- Tools: `search_bills`, `decode_bill`, `lookup_representatives`, `draft_call_script`
- All tools wrap existing lib/server code — no duplicate business logic
- `draft_call_script` keeps the hard rules: cached per `(caller, bill, stance)`, generation logged to `script_generations`, response includes the "AI-drafted. Review and edit before use." disclaimer
- Anonymous free tier works without a key (rate-limited); keyed calls are metered (F5)
- Connectable from Claude and at least one other MCP client, verified end-to-end

### F3. Tracking + Updates (recurrence engine)
**Acceptance criteria:**
- `track_bill` / `untrack_bill` / `get_updates(since)` per API key (and per user once OAuth lands)
- Updates derived from sync-cron diffs of `bill_actions` + status transitions
- Webhook delivery for tracked-bill events on paid tiers (signed payloads, retry w/ backoff, delivery log table)
- Free tier: 3 tracked bills; paid: unlimited (enforced server-side)

### F4. Upcoming-Activity Calendar
**Acceptance criteria:**
- `get_upcoming_activity(topic?, chamber?, days)` — scheduled committee hearings/markups + recently-moved bills, filterable by CRS category
- Sourced from Congress.gov committee-meeting endpoints during sync; served from our DB, never live from Congress.gov on request
- **No floor-vote-date prediction** (brittle; same reasoning that removed it from `urgency_score`)

### F5. Rep Accountability Pack
**Acceptance criteria:**
- `get_rep_profile(bioguide_id | address)` — committees, sponsored/cosponsored bills, recent roll-call votes
- `get_rep_vote(bill_id, rep)` — how a member voted on a specific bill, when a roll call exists
- **Facts only: no scorecards, grades, or ratings** — non-partisan line holds
- Roll-call/member data cached server-side like all Congress.gov data

### F6. Developer Portal + Metering + Billing
**Acceptance criteria:**
- Self-serve `/developers` page: signup → API key in under a minute, no human involved
- Keys hashed at rest in Supabase with RLS; revocation works
- Metering middleware on every tool call → usage events → Stripe Billing Meters
- Stripe Checkout + Customer Portal + Stripe Tax; entitlements updated via webhook; tier limits enforced server-side
- Tiers per `docs/PIVOT.md` §4 (Free / Hobby $19 / Pro $99 / Org $299 — tune at build)
- **Stripe is sanctioned for API billing only. No consumer paywalls, ever.**

### F7. OAuth User-Context Tools (Phase 2)
**Acceptance criteria:**
- MCP OAuth 2.1 (`withMcpAuth`) wired to existing Supabase auth
- `log_call`, `follow_bill`, `get_my_impact`, profile-aware `draft_call_script`
- A user's MCP actions appear in the web app's `/impact` (one identity, any surface)

### F8. Distribution
**Acceptance criteria:**
- Public docs page (tool reference, quickstart, pricing)
- Submitted to: Anthropic connector directory, ChatGPT apps, mcpmarket/Smithery/mcpservers.org
- At least one open-source example client published
- Live + listed by **Aug/Sep 2026** (midterm window)

### Consumer web app (reference client)
- Maintained, kept working, kept free. Bug fixes and pipeline-driven content improvements: yes.
- **No new consumer-only features.** New capability lands as an MCP tool first; the web app may then consume it.

---

## Explicitly OUT of scope (do NOT build, do not suggest)

- **Sales-led anything** — no demos, no custom contracts, no enterprise procurement. Self-serve or it doesn't exist.
- **Option A / B2B2C campaign platform as a sales-led business** — scrapped 2026-06-11. Org tooling only as future self-serve MCP tools (Phase 3, demand-gated).
- **State-level bills/reps** — v2, only after federal MCP proves demand. No LegiScan/Open States yet.
- **Multi-channel message blasts** (email-to-rep campaigns, SMS) — contradicts the verified-call anti-slop positioning. Call scripts + talking points only.
- **Scorecards/grades/ratings of legislators** — facts only.
- **District sentiment / aggregate-analytics products** — premature + privacy-sensitive.
- **Web push notifications** — superseded by webhooks + agent-native updates (F3). Do not resurrect.
- **Twilio / server-side calling / recording** — unchanged ban.
- **Native mobile apps, social features, friend graphs, leaderboards** — unchanged ban.
- **Consumer payments of any kind** — citizens never pay.
- **x402 / crypto payments** — deferred lane; do not build until Stripe pipeline is live and someone asks.

---

## Anti-Scope-Creep Rules

1. If a request would add a feature not listed above, Claude must pause and ask: "This is out of scope per FEATURES.md. Should we update FEATURES.md first, or defer this?"
2. Env vars for deferred features must NOT be present in `.env.local.example`. (`STRIPE_*` becomes legitimate when F6 starts — added in that PR, not before.)
3. New integrations (any new external service) require explicit human approval and an update to this file. Stripe (F6) is pre-approved by the 2026-06-11 pivot decision.
4. "Quick wins" that aren't in this list are not actually quick — they're scope creep wearing a disguise.

---

## Feature Acceptance Template

When a feature is considered "done," it must meet ALL of:

- [ ] Acceptance criteria above are met
- [ ] Tests: Playwright happy-path for anything with a UI surface; vitest coverage for MCP tools/metering logic (tool-level request/response tests)
- [ ] RLS policies exist for any new tables, in the same migration
- [ ] No TypeScript errors, no ESLint errors
- [ ] Metered tools verified to actually meter (a tool that bills wrong is a launch blocker)
- [ ] Env vars documented in `.env.local.example` if any new ones added
- [ ] Any new third-party service has been discussed and approved

---

## Post-v1 Roadmap (NOT a build plan — just capturing ideas)

**v1.1:** x402 per-call lane; rate-limit hardening; usage analytics for customers
**v2:** state legislatures (LegiScan/Open States); Phase 3 self-serve org/campaign tools; custom data deals
**Decision gate:** ~Feb 2027 (90 days post-midterms) — see `docs/PIVOT.md` §7
