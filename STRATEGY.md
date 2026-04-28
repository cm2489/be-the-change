# Be The Change — Master Strategy Document

**Owner:** Colby
**Last updated:** 2026-04-28 (restored from project archive; see Section 11 for current decisions)
**Review cadence:** Quarterly (full rewrite) or upon any pivot

---

## 1. Product Vision

**What we're building:** A pro-democracy platform that reduces the friction citizens feel when engaging with their federal government. Users understand what's happening in Congress, know who represents them, and can take meaningful action in under 60 seconds.

**Why it matters:** Current civic engagement tools (5 Calls, Resistbot, Phone2Action) serve specific slices of this problem. None of them combine AI-personalized advocacy with personalized bill tracking and a path to social/gamified engagement. People feel powerless in their democracy because the tools to participate are scattered, generic, and cold. We make participation feel human and effective.

**Big-picture north star:** Be the one-stop resource for civic participation — federal first, state later, local eventually. The kind of tool that becomes infrastructure rather than a feature.

**MVP narrow focus:** Federal-only. Three features: rep lookup, bill feed filtered by personal values, AI-generated call scripts with 1-click dialing. Personal activity tracking, not social. Push notifications for bills the user follows.

---

## 2. Who This Is For

**Primary user:** A politically engaged American voter, 25–55, who wants to be more active in federal democracy but doesn't know where to start, finds existing tools cold or overwhelming, and trusts that technology should make the hard things easier.

**Secondary user (launch audience):** DC-area early adopters in Colby's network — political professionals, nonprofit staff, journalists, and engaged citizens who'll give quality feedback and share with their networks.

**Not our user (yet):** Partisan activists who already have their preferred tools, state/local advocates (v2), professional lobbyists (never — that's a different product).

---

## 3. Competitive Landscape

| Product | What they do | Where we differ |
|---|---|---|
| 5 Calls | Pre-written scripts, call your reps | We personalize to user values + profile, not generic scripts |
| Resistbot | SMS-to-rep letters | We emphasize phone, we personalize, we track bills by value |
| Phone2Action | B2B advocacy platform for orgs | We're consumer-direct, not for institutions |
| Countable | Bill tracking + engagement | Shut down in 2021 — market gap |
| GovTrack | Bill data + analysis | Data-first, not action-first. We layer action on top of good data. |

**Our wedge:** The intersection of AI personalization + personal values-based filtering + 1-click action. None of the above do all three.

**What we're not trying to be:** A policy research tool, a lobbying platform, a partisan organizing app, or a replacement for Congress.gov.

---

## 4. Build Strategy

**Selected:** Strategy 1 + Strategy 5 hybrid (from the original playbook)

- Primary path: Next.js + Supabase + Anthropic + Congress.gov, solo-built with AI assistance
- Safety net: Budget $500 for narrowly-scoped senior engineer help for integration pain points

**Why this over the alternatives:**

- Most AI-training-data-available stack → fewest AI errors
- Web PWA avoids App Store review timelines for MVP
- Supabase + Vercel autoscale to 100K+ users without architectural rewrites
- Allows solo execution at Colby's current skill level, with rescue capacity for the specific failure modes

**What we're NOT doing:**

- Native mobile (Strategy 3) — wrong stack for current skill level; revisit post-fundraise
- Pure low-code (Strategy 4) — already tried, hit the ceiling
- Design-first showcase (Strategy 2) — already have a strong design system; don't need 2 weeks of Figma before building

---

## 5. Engineering Philosophy

We've adopted a selective subset of the Compound Engineering philosophy (Every Inc), calibrated to a pre-MVP solo builder:

**Adopted fully:**

- Plan → Work → Review → Compound loop as the session rhythm
- `.md` files as the primary context layer (CLAUDE.md, FEATURES.md, ARCHITECTURE.md, SCHEMA.md)
- `docs/solutions/` for institutional knowledge — document every non-trivial fix
- The three questions before approving any AI output: "What was the hardest decision? What alternatives did you reject? What are you least confident about?"
- Plans are the source of truth, not code

**Adopted selectively:**

- `/workflows:plan` for any feature requiring more than 2 hours of work
- `/workflows:review` on every PR, but limited to 2–3 targeted reviewers (security, TypeScript, simplicity) — not the full 14-agent pipeline
- Progressive agent-native capabilities — file access and git operations now, production access later

**Deferred until post-MVP:**

- `--dangerously-skip-permissions` flag
- Full `/lfg` autonomous pipeline
- Parallel feature streams
- 50/50 time split between features and system improvements (we're at ~20/80 until MVP ships)

**Why the calibration:** Compound engineering's advanced patterns assume a seasoned engineer who can read a PR and spot bugs by intuition. At Colby's current stage (Stage 2 → 3 in their framework), the permission prompts and manual reviews are scaffolding that needs to stay up until the skill is built.

---

## 6. Scope Boundaries

### In MVP (v1.0)

- User accounts with political profile (values, issue priorities, ZIP)
- Federal representative lookup (House + 2 Senators)
- Bill feed filtered by user priorities (federal bills only)
- AI-generated call scripts, personalized, with mandatory user review
- 1-click calling via `tel:` links
- Web push notifications (rate-limited, timezone-aware)
- Personal activity tracking (no social)

### Explicitly deferred to v2+

- State-level bills and state representatives
- Payments, subscriptions, Stripe
- Social features (friends, leaderboards, challenges)
- Native mobile apps
- Twilio-based call connection
- Email outreach to reps
- SMS notifications
- Legislator voting records and scorecards

See `FEATURES.md` in the repo for acceptance criteria on each MVP feature.

---

## 7. Success Criteria

### MVP launch success (8 weeks from start)

- All seven MVP features shipped with passing Playwright tests
- Deployed to production on Vercel with clean build
- 50+ users in closed beta from Colby's DC network
- At least 3 qualitative testimonials for fundraising deck
- At least one civic org partnership or co-sign (Code for DC, New America, etc.)
- Legal structure decided and formalized (501c3/c4/PBC)
- Technical infrastructure capable of absorbing 10K users without intervention

### Post-launch fundraise success (12 weeks from start)

- $50K+ raised from Colby's DC donor network
- Clear roadmap for v2 with milestone-tied funding
- Hiring plan for first part-time engineer

### Virality readiness (whenever it happens)

- Rate limiting on all public endpoints
- CAPTCHA/Turnstile on signup
- Hard daily spend cap on Anthropic API
- Bill data cached locally, no live dependency on Congress.gov
- Push notification hard limit (max 2/day/user)
- Abuse report mechanism in UI

---

## 8. Budget & Resources

### One-time (MVP build phase)

- Senior engineer safety net: $500
- Legal consult (nonprofit structure): $400
- Design polish contractor (if volunteer doesn't materialize): $500–1,500
- **Total one-time:** $1,400–2,400

### Ongoing (monthly, during MVP build)

- Vercel Pro: $20
- Supabase Pro: $25
- Claude API (dev + initial users): $50–100
- Domain + miscellaneous: $15
- **Total ongoing:** ~$110–160/month

### Hard limits

- Personal investment ceiling: $5,000 for MVP phase
- Anthropic API daily spend cap: set in dashboard before any viral event

### Volunteer resources being pursued

- Backend/integration engineer (on-call for 5–10 hours over MVP)
- Frontend/design reviewer
- QA/testing pass before beta

---

## 9. Fundraising Posture

**Pre-MVP:** Decline all checks. Early money creates early expectations.

**MVP-complete:** Start soft donor conversations with the closed beta demo. Frame as "pre-launch beta in 4 weeks."

**Post-launch:** Raise $50–100K from DC network.

**Donor positioning:**

- Nonpartisan civic infrastructure (messaging that works for c3 and c4 donors)
- Emphasize design quality and technical execution (both are differentiators)
- Tie funding to specific milestones, not vague "development"
- Example tier: $25K funds through public launch, $50K adds mobile, $100K adds state-level coverage

**Legal structure decision deadline:** Week 3 (before first check is even offered).

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Integration hell recurrence | Medium | High | `.md` scaffolding, weekly reviews, $500 on-call engineer |
| Timeline slippage past 8 weeks | Medium | Medium | Weekly check-ins, aggressive scope discipline |
| Claude API cost blowup at launch | Medium | High | Script caching, hard spend cap, rate limits |
| Hallucinated scripts causing trust incident | Low | Very High | Mandatory user review step, disclaimer in UI, logging |
| Bot flood during viral moment | Medium | High | CAPTCHA on signup, rate limits, abuse reporting |
| Burnout in weeks 4–6 | Medium | Very High | One day off per week non-negotiable, explicit "done" criteria |
| App Store rejection (post-MVP mobile) | Low | Medium | Web-first MVP sidesteps this until v2 |
| Partisan perception damaging reach | Medium | Medium | Scrupulously nonpartisan messaging, equal-access framing |
| Loss of strategic docs from repo | Realized | Medium | STRATEGY.md and WEEKLY_PLAN.md were absent from repo as of 2026-04-28; restored from project archive. Going forward, treat both files as required commits. |

---

## 11. Decision Log

Use this section to capture major decisions, their rationale, and the alternatives rejected. Update as decisions are made. Do not rewrite history here — append.

| Date | Decision | Rationale | Alternatives rejected |
|---|---|---|---|
| Week 0 | Next.js + Supabase stack | Most AI-friendly, scales to launch | Native mobile (skill gap), pure low-code (already failed) |
| Week 0 | Web PWA, no native mobile for MVP | Faster, no App Store risk, skill-appropriate | Expo (Strategy 3) |
| Week 0 | Federal-only scope | Deliverable in 8 weeks | Federal + state (2x complexity) |
| Week 0 | Compound engineering, selective adoption | Philosophy yes, advanced patterns no | Full stack adoption (premature) |
| Week 0 | `tel:` links for calling, no Twilio | Zero TCPA exposure, ships fast | Twilio call-connect (v2) |
| 2026-04-28 | **STRATEGY.md and WEEKLY_PLAN.md restored to repo** | Both files were absent from the working tree and from git history as of Phase 1 of Feature 3 rebuild. Restored from the project archive (Anthropic project docs). | Continuing without them (rejected — decision log is non-negotiable infrastructure) |
| 2026-04-28 | **Feature 3 scope expansion: bill `issue_analysis` jsonb** | Per-bill structured impact analysis (one record covering all 10 top-level categories from `lib/interests.ts`, filtered to user's interests at render time) is meaningfully better demo material than the FEATURES.md baseline of a single LLM summary. Build is moving faster than WEEKLY_PLAN.md predicted, so the extra cost is absorbable. | (a) MVP-honest path — single `ai_summary` text only, faster to ship. (b) Per-user analysis — over-caches, wrong architecture for objective bill content. |
| 2026-04-28 | **Onboarding gate for `/bills`: keep open, ship default feed** | The "skip for now" affordance on the onboarding flow is intentional MVP UX. Forcing onboarding completion would be a product-flow change, not a Feature 3 rebuild. Default feed is urgency-sorted, no relevance badge, with a top-of-feed banner nudging the user back to onboarding. | Force onboarding completion before `/bills` (rejected — out of scope for a feature rebuild). |
| 2026-04-28 | **Bill-tagger taxonomy lock to `lib/interests.ts`** | `lib/bill-tagger.ts` currently hard-codes 35 subcategory ids without importing from `lib/interests.ts`, and emits subcategory ids only — meaning the relevance badge intersection (`bills.issue_tags` ∩ `user_interests.category`) silently fails today. Refactor: import canonical taxonomy, validate at module load, emit both subcategory ids and derived parent category ids. | (a) Emit only top-level category ids (rejected — loses subcategory specificity). (b) Walk parents in the RPC instead of in the tagger (rejected — pushes complexity into SQL where it's harder to debug). |
| 2026-04-28 | **Cron incrementality + sync_state table; backfill deferred** | Current cron is a hard-cap (top 20 actionable bills per run), not incremental — so a thin relevance feed for less-active issues. Switch to `fromDateTime`-filtered incremental sync backed by a single-row `sync_state` table. One-shot 119th-Congress backfill script tracked separately in `docs/deferred.md` and run before first donor demo. | (a) Stay scrappy with the 20-bill cap (rejected — undermines the relevance feed, which is the differentiator). (b) Backfill in same migration (rejected — bloats Phase 2 scope, prefer to validate incremental cron against small dataset first). |
| 2026-04-28 | **Urgency score formula: drop `vote_date` branch** | The current formula leans 35% on `vote_date`, which Congress.gov's detail endpoint does not reliably surface. Parsing dates out of free-form `latestAction.text` is brittle. Simpler formula = `status` weight + `last_action_date` recency tiebreaker. Documented in SCHEMA.md. Revisit in v1.1 if urgency sort feels wrong in beta. | Parse `latestAction.text` for date phrases (rejected — high effort, brittle, wrong scope for MVP). |
| 2026-04-28 | **App layout bug fix folded into Phase 3** | `app/(app)/layout.tsx:18` queries non-existent columns (`onboarding_completed`, `onboarding_skipped`) and uses the wrong filter column (`.eq('id', …)` should be `user_id`). Bug is in the same blast radius as the Feature 3 rebuild. Fix as a separate commit on the same feature branch. | Separate ticket later (rejected — cheaper to fix while the file is already open). |

---

## 12. What Changes Here vs. in Weekly Doc

**This doc changes** when:

- The product vision or scope fundamentally shifts
- A major strategic pivot (e.g., pursuing a partnership that changes everything)
- Budget or resource assumptions change significantly
- Risks materialize and require mitigation updates
- Post-MVP, rewritten in full for v2 roadmap

**This doc does NOT change** weekly, tactically, or based on a hard week. The weekly doc handles that. If you find yourself wanting to edit the strategy doc weekly, something is off.

---

## 13. Review Schedule

- **Weekly:** Review Section 11 (Decision Log). Append if decisions were made. No other edits.
- **Monthly:** Review Section 7 (Success Criteria) against actual progress. Note gaps.
- **Quarterly:** Full re-read. Edit anywhere needed. Date the revision at the top.
- **After MVP launch:** Full rewrite for v2 direction.

---

## 14. North Star Reminder

When weeks get long and the to-do list feels infinite, return here:

We are building a tool that helps Americans participate in their democracy with less friction and more dignity. The product is a means; the outcome is citizens who feel heard. If a feature doesn't serve that outcome, it doesn't belong in the MVP.
