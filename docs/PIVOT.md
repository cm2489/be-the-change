# PIVOT.md — Oravan Civic Action MCP

**Decided:** 2026-06-11 (Colby, after competitor/market research session)
**Status:** Direction locked. Build not yet started — docs reworked first so guardrails match the mission.

---

## 1. The Decision

Oravan pivots from a **consumer civic engagement web app** to **agent-native civic action infrastructure**: a monetized remote MCP server (+ HTTP API) that lets AI assistants, agents, and third-party apps look up representatives, decode legislation, draft call scripts, track bills, and log civic actions.

The existing web app survives as the **reference client and live demo** — not the product.

Operating constraint that shaped this: **solo, no employees, no sales motion, ~4 hrs/week steady-state ops.** Everything in scope must be self-serve for the customer and agent-operable for us.

## 2. Why (evidence summary)

- **B2C civic apps don't monetize.** Causes (200M users), Brigade, and consumer Countable all died or pivoted to enterprise; survivors (5 Calls, Resistbot) are donation-funded nonprofits. Citizens don't pay for their own activism.
- **The money is B2B (Quorum, FiscalNote/VoterVoice, Muster ~$995/mo, CiviClick) — but it's sales-led.** Rejected: conflicts with the no-employees / 4-hrs-week constraint. ("Option A" from the research session is scrapped; its org-campaign idea survives only as future self-serve MCP tools.)
- **The MCP gap is real and current.** Government ships *data* MCP servers (GovInfo, Census, Data.gov, community Congress.gov); every major AI platform supports MCP (2026). Nobody ships the **action layer** — decoded bills + rep lookup + scripts + tracking + logging. Our primitives are already built.
- **Anti-slop positioning.** Congress receives 50M+ emails/yr and discounts AI-generated floods. Verified-human, reviewed-before-use, **call-first** advocacy is the high-signal channel — and is already how Oravan is designed.
- **Honest revenue expectations** (recorded so future-us doesn't gaslight itself): base case **$5–25K ARR yr 1**; good case **$50–120K** (registry placement + 2026 midterm cycle); tail case **$250K+** only if agent-mediated civic action becomes mainstream behavior. This is a near-zero-marginal-cost asset with an asymmetric tail, not a plannable $500K business.

## 3. The Product — tool surface

### Phase 1 — Core tools (anonymous free tier + API-key metered)
| Tool | Wraps (existing) | Value vs. free gov MCPs |
|---|---|---|
| `search_bills(topic, status, urgency)` | Feed RPCs + CRS taxonomy | Decoded corpus: plain-language summaries, headlines, urgency scores, clean 12-category taxonomy |
| `decode_bill(id)` | `ai_summary` / `issue_analysis` | The "explain it like I'm a citizen" layer |
| `lookup_representatives(address)` | Geocode → district → Congress.gov | Direct comp: Cicero sells exactly this per-credit |
| `draft_call_script(bill, stance, values)` | Cached script generation | The unique action primitive; returns mandatory AI disclaimer |

### Phase 1.5 — Call-volume drivers (the three value-adds; build with Phase 1)
The principle: **recurrence beats coverage.** One-shot lookup tools get called when a human asks; these give agents a standing reason to call daily.

1. **Tracking + updates — the recurrence engine.**
   `track_bill` / `untrack_bill` / `get_updates(since)`, plus **webhook delivery on paid tiers**. Sync cron diffs `bill_actions` + status transitions (already stored). A tracked portfolio converts Q&A into a daily poll; tracking limits are the natural free→paid gate (free: 3 bills; Pro: unlimited + webhooks). This is deferred Feature 6 (web push) reborn agent-native.
2. **Upcoming-activity calendar — the "this week" layer.**
   `get_upcoming_activity(topic?, chamber?, days)` — scheduled committee hearings/markups + recently-moved bills from Congress.gov committee-meeting data. Time-anchored queries recur by nature ("what's happening this week on healthcare"); static gov MCPs serve documents, not action windows. Pairs with scripts: "hearing Thursday → call today." Scope note: list *scheduled hearings/markups* (solid data); do NOT attempt floor-vote-date prediction (dropped from `urgency_score` for brittleness — same reasoning holds).
3. **Rep accountability pack — closing the loop.**
   `get_rep_profile(bioguide|address)` (committees, sponsored bills, recent votes) + `get_rep_vote(bill_id, rep)` from Congress.gov member/roll-call endpoints. Completes the engagement loop: decode → call → **"your rep voted yes — here's what happened."** "How did my rep vote on X" is a top-frequency civic query we currently can't answer. **Facts only — no scorecards, grades, or ratings** (holds the non-partisan line; consumer scorecard UI stays out of scope).

**Considered and rejected:** multi-channel message generation (email-blast tooling contradicts the verified-call anti-slop positioning — call scripts + talking points only); state legislatures (big lift + new dependency; v2 once federal proves demand); district sentiment / aggregate analytics (needs usage volume first; privacy-sensitive).

### Phase 2 — OAuth user-context tools
`log_call`, `follow_bill`, `get_my_impact`, profile-aware scripts via MCP OAuth 2.1 (`withMcpAuth`) wired to existing Supabase auth. Makes an Oravan account usable from inside Claude/ChatGPT.

### Phase 3 — Self-serve org tools (future, demand-gated)
`create_campaign` / `get_campaign_impact`. Only if Phase 1/2 shows org pull. Never sales-led.

## 4. Monetization pipeline (zero-touch, end to end)

1. **Self-serve API keys** — `/developers` page; hashed keys in Supabase (RLS).
2. **Metering middleware** — every MCP tool call recorded per key; usage events → Stripe Billing Meters.
3. **Stripe usage-based subscriptions** — Checkout + Customer Portal + Stripe Tax; webhook → entitlements in Supabase. Ladder (tune at build time):
   - **Free** — 500 calls/mo, 3 tracked bills
   - **Hobby $19/mo** — 10K calls
   - **Pro $99/mo** — 100K calls, unlimited tracking, webhooks, script tools
   - **Org $299/mo** — campaign tools + impact dashboards (Phase 3)
4. **x402 per-call lane (later, optional)** — $0.005–$0.02/call USDC for wallet-holding agents. Cheap to add; don't lead with it (whole-ecosystem volume still small).
5. **Stripe is now sanctioned** for API billing only — no consumer paywalls, ever. The citizen-facing loop stays free.

**Unit economics:** summaries ~$0.01/bill pre-generated; scripts cached by design; Congress.gov free; geocoding is the only real per-call cost. Constraint is demand, never cost.

## 5. Distribution (all free, all async)

Anthropic connector directory, ChatGPT apps, MCP registries (mcpmarket, Smithery, mcpservers.org), open-source examples, docs site, the consumer app as living demo. Press angle: *"the first agent-native way to act on legislation, not just read it."* **Timing: live + listed by Aug/Sep 2026** to catch the midterm cycle (Nov 2026) — the one organic demand spike this market reliably produces.

## 6. Operating model (the 4 hrs/week contract)

Agent-run (scheduled routines): nightly sync + corpus-freshness monitor, summarize/headline pipeline, Stripe webhook health, support-inbox triage, weekly metrics digest (MRR, usage, churn, AI spend). Hard cost ceiling = prepaid Anthropic balance, auto-reload OFF.
Colby: read the digest, merge PRs, approve irreversible actions, answer rare human email. **No sales calls, no demos, no employees.**

## 7. Decision gate

**~Feb 2027** (90 days post-midterms): review MRR + usage. Growing → keep feeding 4 hrs/week. Flat → keep alive as near-zero-cost public good; attention moves elsewhere. Either way the corpus + pipeline remain a real asset.

## 8. What dies / what survives

| | |
|---|---|
| **Dies** | Consumer app as *the product*; sales-led B2B2C ("Option A"); web-push roadmap (superseded by webhooks/agent updates); donor-MVP framing |
| **Survives unchanged** | Bill/rep/script/call data spine; design system + locked screens; RLS/migrations/commit discipline; non-partisan + review-before-use principles; free citizen loop |
| **Survives, repurposed** | `/bills`, `/impact`, call flow → reference client + demo; deferred web-push schema → webhook delivery infra |

## 9. Build sequence (each step = its own branch/PR, gated as usual)

1. **Steady-state data pipeline** — re-arm sync cron; sync-time `ai_summary`/`ai_headline`/retag for new bills. *The product's heartbeat; prerequisite to everything.*
2. **MCP server core** — `app/api/[transport]/route.ts` via Vercel `mcp-handler` (Streamable HTTP); Phase 1 tools wrapping existing lib code.
3. **Value-add tools** — tracking/updates, calendar, rep accountability (new sync-cron outputs + Congress.gov member/committee endpoints).
4. **Keys + metering + Stripe** — developer portal, usage middleware, billing webhooks, entitlements.
5. **Docs + distribution** — public docs page, registry submissions, example clients.
6. **OAuth user tools** (Phase 2).

## 10. Doc changes made with this pivot (2026-06-11)

- `FEATURES.md` — rewritten around the MCP product (this file is the scope authority).
- `CLAUDE.md` — identity + scope updated; Stripe un-banned for API billing only; MCP stack facts added.
- `ARCHITECTURE.md` — MCP server + billing architecture and flows added.
- `STATUS.md` — phase + next action updated.
- `SCHEMA.md` — untouched (no schema changes yet; new tables land with their migrations).
