# CLAUDE.md

This file is read by Claude Code at the start of every session. Its rules override any defaults from your training data. Do not skip it.

---

## Project Identity

**Name:** Oravan
**What it is:** Agent-native civic action infrastructure — a monetized remote MCP server + HTTP API that lets AI assistants and apps look up federal representatives, decode legislation, draft call scripts, track bills, and log civic actions. The consumer web app is the free **reference client**, not the product.
**Who uses it:** AI assistants/agents (via MCP), developers and orgs embedding civic action (via API key), and — through the reference client — U.S. voters.
**Current phase:** Post-pivot (2026-06-11), solo-built, **no employees, no sales motion, ~4 hrs/week steady-state ops**. Target: live + listed in MCP registries by Aug/Sep 2026 (midterm window).
**Strategy doc:** `docs/PIVOT.md` — read it before any scope or product reasoning.

## Scope (read this before adding anything)

**In scope (MCP v1 — full criteria in `FEATURES.md`):**
1. Steady-state data pipeline (sync cron + sync-time AI summaries/headlines/tags)
2. MCP server core tools: `search_bills`, `decode_bill`, `lookup_representatives`, `draft_call_script`
3. Tracking + updates (`track_bill`, `get_updates`, paid webhooks)
4. Upcoming-activity calendar (committee hearings/markups; no vote-date prediction)
5. Rep accountability pack (profiles + roll-call votes — facts only, no scorecards)
6. Developer portal: self-serve API keys, metering, Stripe usage-based billing
7. OAuth user-context tools (Phase 2)
8. Registry distribution + docs

**Explicitly OUT of scope (do not add, do not suggest):**
- Sales-led anything (demos, custom contracts) — self-serve or it doesn't exist
- State-level bills or state representatives (v2; no LegiScan, no state APIs)
- **Consumer payments of any kind** — citizens never pay; Stripe is for API billing only
- Multi-channel message blasts (email-to-rep, SMS) — call scripts + talking points only
- Scorecards/grades/ratings of legislators
- Web push notifications (superseded by webhooks/agent updates — do not resurrect)
- Social features, native mobile apps, Twilio call connection (unchanged bans)
- x402/crypto payments (deferred until Stripe is live and someone asks)

If a user request would expand scope, pause and ask for confirmation before implementing.

## Critical Stack Facts (override your defaults)

This project uses bleeding-edge Next.js. Your training data probably predates some of these changes. **Follow these rules, not your defaults:**

### Next.js 16 (NOT 14 or 15)
- **Middleware is now `proxy.ts`**, not `middleware.ts`. The exported function is `proxy`, not `middleware`. The file already exists at the repo root.
- `proxy.ts` runs on the Node.js runtime (not Edge).
- Config flags are renamed: `skipProxyUrlNormalize` (not `skipMiddlewareUrlNormalize`).
- Caching semantics changed in v15 → v16. When in doubt, read the Next.js 16 docs before writing cache directives.

### Supabase — Auth
- Use **`@supabase/ssr`** for all auth code. This is the modern, supported package.
- **DO NOT use `@supabase/auth-helpers-nextjs`.** It is deprecated. If you see it in the codebase, flag it for removal — do not add new code that uses it.
- Use `createServerClient` for server components, route handlers, and proxy.ts.
- Use `createBrowserClient` for client components.
- Auth is enforced in `proxy.ts`. Public routes are defined in the `PUBLIC_ROUTES` array there.

### Tailwind CSS
- This project uses **Tailwind v3**. Do not use v4 syntax, v4 config formats, or v4-only features.
- Config file is `tailwind.config.ts`.
- If you see `@tailwindcss/postcss` (v4 package) in `package.json`, flag it for removal.

### Federal Representatives Lookup — CRITICAL
- **DO NOT use the Google Civic Information API Representatives endpoint** (`representativeInfoByAddress` or `representativeInfoByDivision`). It was shut down on April 30, 2025. Any code calling these endpoints will fail at runtime.
- Our lookup flow for federal reps:
  1. User enters address
  2. Geocode address → get district (via Google Divisions API or alternative geocoder)
  3. Look up federal reps for that district via **Congress.gov API** (`CONGRESS_API_KEY` in env)
- State reps lookup is OUT of scope for MVP.

### AI Script Generation
- Use Anthropic SDK (`@anthropic-ai/sdk`) with Claude models.
- Every script generation must be cached per `(caller, bill_id, stance)` tuple — user_id in the web app, API key / OAuth identity over MCP. Do not regenerate on every request. This is a hard cost control, not a performance nice-to-have.
- Human review before use is non-negotiable: in the web app, the review step gates the "call" button; over MCP, every `draft_call_script` response must carry the disclaimer so the client surfaces it. Never auto-dial with unreviewed AI content.
- Every generated script must include a disclaimer: "AI-drafted. Review and edit before use."
- Log all generations (anonymized caller, bill, prompt hash, output hash, timestamp) to a `script_generations` table for audit + cost tracking.

### MCP Server + Billing — CRITICAL
- The MCP server lives in this app: `app/api/[transport]/route.ts` via Vercel's `mcp-handler` (Streamable HTTP). Do not stand up a separate service.
- MCP tools are thin wrappers over existing `lib/` and server-action code — never duplicate business logic into tool handlers.
- **Every keyed tool call must be metered.** A tool that bills wrong is a launch blocker, same severity as an RLS hole.
- Tier limits (calls/mo, tracked bills, webhooks) are enforced server-side, never client-side.
- Stripe is sanctioned for **API billing only** (Billing Meters + Checkout + Customer Portal + Tax). No consumer paywalls. `STRIPE_*` env vars land in the F6 PR, not before.
- Phase 2 auth: MCP OAuth 2.1 via `withMcpAuth`, wired to the existing Supabase auth — no parallel identity system.

### Push Notifications — SUPERSEDED
- Web push is dead (pivot 2026-06-11): superseded by paid webhooks + agent-native `get_updates`. Do not build on `web-push`/VAPID. The `push_subscriptions`/`notifications_sent` tables stay until a cleanup migration retires them.

## Coding Conventions

- **TypeScript strict mode.** No `any` without comment explaining why.
- **Server actions over API routes** for mutations where possible (Next.js 16 pattern).
- **Row-Level Security (RLS) on every Supabase table.** No exceptions. If you add a table, you add its RLS policies in the same migration.
- **Env vars:** Never hard-code API keys, URLs, or secrets. Never log env var values. Never send them to the client unless prefixed `NEXT_PUBLIC_`.
- **File size cap:** Components under 200 lines, route handlers under 150 lines. If you're about to exceed this, split the file.
- **No new dependencies without permission.** If a task seems to need a new npm package, ask first. The current dependency list is already wider than MVP needs.
- **Migrations:** All schema changes go through `supabase/migrations/` with a descriptive filename. Never modify the database via the Supabase dashboard for anything that should be version-controlled.

## Session Workflow

At the start of every coding session, Claude should:

1. Read this file (`CLAUDE.md`)
2. Read `FEATURES.md` to understand current scope and explicitly-deferred work; read `docs/PIVOT.md` if the task touches product direction, monetization, or the MCP surface
3. Read `ARCHITECTURE.md` if the task touches system design, integrations, or data flow
4. Read `SCHEMA.md` if the task touches the database in any way
5. Review recent `git log` (last 5 commits) to understand current state
6. State the plan before writing code, and wait for confirmation on non-trivial tasks

## Review & Working Agreement

Your work is reviewed by Claude.ai acting as a redline reviewer. Expect claims, scope, and confidence to be verified against the actual repo. Pre-justify non-trivial decisions, and never fold deferred work into an unrelated task — surface it as its own step instead.

## Design Workflow

The front-end / design phase has its own operating doc: **`docs/DESIGN_PLAYBOOK.md`** — read it before any design work. It holds the full workflow, toolkit, guardrails, and reference set; this section is only the pointer.

- **`docs/DESIGN_PLAYBOOK.md` is the source of truth for the phase.** Don't design from training-data defaults — build against the playbook, the tokens in `tailwind.config.ts` / `globals.css`, and the decisions doc below.
- **Tools, by job:** `frontend-design` skill = the **build spine** (generates/edits code inside the tokens). Impeccable = **critique, not building** — run **`npx impeccable detect` first** as a deterministic slop-check (trust it over the LLM for "is this slop?"), *then* **`/critique`** for the judgment pass. `creative-director` skill = the **ceiling pass**, run only after a screen is at a competent baseline. Floor before ceiling.
- **Restraint is the brief; tokens are the cage.** Snap to the token system — fewer fonts, colors, effects. When in doubt, `/quieter` and `/distill`, not `/bolder`.
- **`docs/DESIGN_DECISIONS.md` is the cross-screen memory.** Every locked choice goes there with its exact class string — the build tools are single-generation, so that doc is what keeps screen #6 consistent with screen #1.
- **Screenshots at 390px + desktop every iteration are non-negotiable.** If you didn't look at the render, you didn't verify it.

## Hard "Do Not Do" Rules

- Do not silently add new env vars. Any new env var requires explicit discussion.
- Do not add new external services (Twilio, Segment, PostHog, etc.) without explicit permission. Exception: **Stripe is pre-approved for API billing (F6)** by the 2026-06-11 pivot decision — but only in the F6 PR, only for API billing.
- Do not "refactor" files that weren't part of the task. Stay in scope.
- Do not delete tests to make a build pass. If a test is broken, explain why and propose a fix.
- Do not disable TypeScript errors with `@ts-ignore` or `@ts-expect-error` without a comment explaining the specific reason and a plan to remove.
- Do not commit directly to `main`. Use feature branches. Every feature = one branch.
- Do not ship a feature without at least one Playwright test covering the happy path.
- **Do not run destructive MCP operations on production Supabase without an explicit approval prompt.** TRUNCATE, DELETE, DROP, ALTER (data or schema), and anything else that removes data or modifies schema outside a tracked migration must be confirmed with the user before execution — same approval gate as destructive bash commands. A pre-action "heads up" notice is not approval. "Risk is essentially zero" framing is not sufficient justification. Default = ask, not act. Schema changes belong in `supabase/migrations/`, not in ad-hoc MCP DDL.
- Do not jump ahead in a gated or multi-step task. Complete each step or batch fully and wait for explicit sign-off before starting the next; never skip ahead to a later gate, commit, or feature out of sequence. "One step at a time" means stop and report at each checkpoint, even when the next step seems obvious.
- Do not add scope you weren't asked for — no fallbacks, error handling, or "while I'm here" extras beyond the stated task, and never re-introduce something you explicitly said you would not add. When asked to stop a behavior (e.g. repeated screenshot/approval loops, or re-confirming before a change already requested), stop it and make the requested change directly rather than asking again.

## Commit Discipline

- One feature per branch. Branch name format: `feat/[short-description]` or `fix/[short-description]`.
- Commit messages: imperative mood, first line under 72 chars. ("Add rep lookup by ZIP", not "Added rep lookup")
- Before every commit: `npm run lint` must pass. Build must pass. Any Playwright test related to the touched code must pass.
- For docs-only commits (.md files, no code) skip the lint/build/test gate.
- Stacked branches: when a feature branch is based on another unmerged branch, the parent must land on `main` first. Don't open a child PR against `main` while its parent is unmerged — the child's diff will silently bundle the parent's commits.
- Before any `git push` or `gh pr create`, run `git log main..<branch>` and state what the PR actually carries. Never assume a child branch's PR contains only the child's commits.
- **PR workflow.** `gh` is installed and authenticated. **Claude opens the PR itself** via `gh pr create` (push the branch first, then open the PR — this is what `gh` is for here). **Claude never merges** — Colby reviews and merges every PR himself in the browser (`main` auto-deploys to live `oravan.org`, so a human look before merge is intentional). Never run `gh pr merge`.
- **Proportional docs — match ceremony to stakes.** **Substantive changes** — code, schema, behavior, durable rules/decisions (`CLAUDE.md`, `ARCHITECTURE.md`, `SCHEMA.md`, `docs/DESIGN_DECISIONS.md`), user-facing copy — keep the full branch + PR gate. **Trivial non-shipping working docs** — working memory like `STATUS.md` and `docs/deferred.md` — don't each need their own commit/push. **Prefer batching them into the next substantive commit related to the state they describe** (e.g. refresh `STATUS.md` as part of the feature commit that changed that state); commit them **straight to `main`** on their own only when there's nothing substantive to batch with for a while. The asymmetry is the point: batching a working doc *into* a related substantive commit is fine; bundling a substantive change (code/schema/decision) *into* a docs commit is still not. (A STATUS refresh is working memory, not reviewable history — it shouldn't sit in PR history. Straight-to-`main` works because `main` has no GitHub branch protection — keep it that way, or revisit.)

## When Things Break

If a change breaks something that was working:
1. Do not try to "fix forward" by adding more code.
2. Revert to the last known good state (`git reset --hard HEAD~1` or the specific commit).
3. Re-read this file, `ARCHITECTURE.md`, and the relevant existing code.
4. Make a smaller, more targeted change.

The repo has 73 commits as of this writing. Use `git log` and `git blame` generously. The history is your friend.
