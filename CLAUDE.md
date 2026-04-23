# CLAUDE.md

This file is read by Claude Code at the start of every session. Its rules override any defaults from your training data. Do not skip it.

---

## Project Identity

**Name:** Be The Change
**What it is:** A pro-democracy civic engagement web app that reduces friction between citizens and their elected federal representatives.
**Who uses it:** U.S. voters who want to engage with the federal legislative process but don't know how.
**Current phase:** Pre-MVP, solo-built, targeting a donor-ready MVP in 6–8 weeks.

## MVP Scope (read this before adding anything)

**In scope:**
1. User accounts with political profile (values, issue priorities, ZIP code)
2. Lookup of user's federal representatives (House rep + 2 Senators) by address
3. AI-generated call script personalized to user's profile + current bill
4. List of bills currently active in Congress, filterable by user's issue priorities
5. 1-click calling via `tel:` link (mobile) or display of phone number (desktop)
6. Web push notifications for priority bill alerts
7. Personal activity tracking (bills followed, calls made)

**Explicitly OUT of scope for MVP (do not add, do not suggest):**
- State-level bills or state representatives (no LegiScan, no state APIs)
- Payments, subscriptions, or Stripe integration of any kind
- Social features (friend graphs, leaderboards, challenges, public profiles)
- Twilio-based call connection (MVP uses `tel:` links only)
- Email outreach to reps (phone only)
- Text message / SMS features
- Native mobile app (web PWA only)

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
- Every script generation must be cached per `(user_id, bill_id, stance)` tuple — do not regenerate on every request. This is a hard cost control, not a performance nice-to-have.
- Include a mandatory user review step in the UI before the "call" button activates. Never auto-dial with unreviewed AI content.
- Every generated script must include a disclaimer: "AI-drafted. Review and edit before use."
- Log all generations (anonymized user, bill, prompt hash, output hash, timestamp) to a `script_generations` table for audit + cost tracking.

### Push Notifications
- Use `web-push` with VAPID keys (already in env).
- Hard limit: max 2 pushes per user per day, enforced server-side.
- No political content in the notification body itself — only neutral prompts like "A bill you follow has an upcoming vote."

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
2. Read `FEATURES.md` to understand current MVP scope and explicitly-deferred work
3. Read `ARCHITECTURE.md` if the task touches system design, integrations, or data flow
4. Read `SCHEMA.md` if the task touches the database in any way
5. Review recent `git log` (last 5 commits) to understand current state
6. State the plan before writing code, and wait for confirmation on non-trivial tasks

## Hard "Do Not Do" Rules

- Do not silently add new env vars. Any new env var requires explicit discussion.
- Do not add new external services (Stripe, Twilio, Segment, PostHog, etc.) without explicit permission.
- Do not "refactor" files that weren't part of the task. Stay in scope.
- Do not delete tests to make a build pass. If a test is broken, explain why and propose a fix.
- Do not disable TypeScript errors with `@ts-ignore` or `@ts-expect-error` without a comment explaining the specific reason and a plan to remove.
- Do not commit directly to `main`. Use feature branches. Every feature = one branch.
- Do not ship a feature without at least one Playwright test covering the happy path.

## Commit Discipline

- One feature per branch. Branch name format: `feat/[short-description]` or `fix/[short-description]`.
- Commit messages: imperative mood, first line under 72 chars. ("Add rep lookup by ZIP", not "Added rep lookup")
- Before every commit: `npm run lint` must pass. Build must pass. Any Playwright test related to the touched code must pass.

## When Things Break

If a change breaks something that was working:
1. Do not try to "fix forward" by adding more code.
2. Revert to the last known good state (`git reset --hard HEAD~1` or the specific commit).
3. Re-read this file, `ARCHITECTURE.md`, and the relevant existing code.
4. Make a smaller, more targeted change.

The repo has 73 commits as of this writing. Use `git log` and `git blame` generously. The history is your friend.
