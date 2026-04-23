# CLEANUP.md — Step-by-Step Runbook

**Purpose:** Move the `be-the-change` repo from its current "25% done + scope creep + deprecated API" state to a clean, focused foundation in about 2 hours.

**For:** A solo builder with limited terminal experience. Every command here is literal copy-paste. If a step fails, stop and read the "If this fails" note under that step before continuing.

**Time budget:** 90–120 minutes.

**Before you start:**
- Close any running dev server (`Ctrl+C` in whichever terminal is running `npm run dev`)
- Open a fresh terminal window in the `be-the-change` repo folder
- Have this file open on a second monitor or separate window for reference

---

## Phase 0 — Pre-Flight Check (5 min)

### Step 0.1: Verify you're in the right folder

```bash
pwd
```

Expected output: something ending in `/be-the-change`.

**If this fails:** You're in the wrong folder. Use `cd` to navigate to wherever you cloned the repo.

### Step 0.2: Verify git state is clean

```bash
git status
```

Expected output: `nothing to commit, working tree clean` or only untracked files you know about.

**If this fails:** You have uncommitted changes. Either commit them (`git add . && git commit -m "wip: before cleanup"`) or stash them (`git stash`). Do not start cleanup with dirty working state.

### Step 0.3: Make sure you're on main and up to date

```bash
git checkout main
git pull origin main
```

### Step 0.4: Create a cleanup branch

```bash
git checkout -b cleanup/pre-mvp-reset
```

Expected output: `Switched to a new branch 'cleanup/pre-mvp-reset'`.

**Why:** Everything you do from this point forward is on a branch you can throw away if it goes sideways. This is your safety net.

---

## Phase 1 — Drop In the Context Files (5 min)

You should have four `.md` files from the previous conversation: `CLAUDE.md`, `FEATURES.md`, `ARCHITECTURE.md`, `SCHEMA.md`.

### Step 1.1: Copy the four files to your repo root

Move them from your Downloads folder (or wherever they are) into the `be-the-change` root folder, alongside `package.json`. Use Finder/Explorer — no terminal needed.

### Step 1.2: Verify they're in the right place

```bash
ls -la *.md
```

Expected output: four lines showing `ARCHITECTURE.md`, `CLAUDE.md`, `FEATURES.md`, `SCHEMA.md`.

### Step 1.3: Commit them immediately (before you do anything else)

```bash
git add CLAUDE.md FEATURES.md ARCHITECTURE.md SCHEMA.md
git commit -m "docs: add context engineering scaffolding"
```

**Why:** These files are the foundation for everything that follows. If cleanup goes wrong, these files are still saved.

---

## Phase 2 — Dependency Cleanup (10 min)

### Step 2.1: Remove the deprecated Supabase auth helpers

```bash
npm uninstall @supabase/auth-helpers-nextjs
```

**What this does:** Removes the old, deprecated Supabase auth package. Your `proxy.ts` already uses the modern `@supabase/ssr` — this removal just closes the door on the old package accidentally being reintroduced.

### Step 2.2: Remove the phantom Tailwind v4 package

```bash
npm uninstall @tailwindcss/postcss
```

**What this does:** Removes a Tailwind v4 package that's conflicting with your actual Tailwind v3 setup. Your `tailwind.config.ts` is v3 — this just cleans up the mismatch.

### Step 2.3: Remove Stripe packages (out of MVP scope)

```bash
npm uninstall stripe @stripe/stripe-js
```

**What this does:** Payments are v2+. Every package here is a doorway for the AI to build down a path you haven't chosen.

### Step 2.4: Verify the remaining dependencies

```bash
cat package.json
```

Look for `dependencies` and confirm these are present:
- `@anthropic-ai/sdk`
- `@supabase/ssr`
- `@supabase/supabase-js`
- `class-variance-authority`
- `clsx`
- `lucide-react`
- `next`
- `react`, `react-dom`
- `resend`
- `tailwind-merge`
- `web-push`

And these should NOT be present:
- `@supabase/auth-helpers-nextjs`
- `@tailwindcss/postcss`
- `stripe`
- `@stripe/stripe-js`

**If anything is wrong:** Run `npm install` and re-check. If still wrong, paste the output back into Claude for help.

### Step 2.5: Verify the app still builds

```bash
npm run build
```

Expected: build completes with no errors. Warnings are OK.

**If this fails:** The most likely cause is a file that imports `@supabase/auth-helpers-nextjs`. Scroll up in the error output and find the file name, then go to Phase 3.1 below for how to fix it.

---

## Phase 3 — Audit for Deprecated / Out-of-Scope Code (20 min)

This is the detective phase. You're looking for code that references things that shouldn't be there.

### Step 3.1: Find any remaining Supabase auth-helpers usage

```bash
grep -r "auth-helpers-nextjs" --include="*.ts" --include="*.tsx" .
```

Expected output: nothing, or only a mention in `package-lock.json` (ignore that).

**If matches found:** Open each file in Cursor/VSCode and ask Claude Code (in that file's context) to convert from `auth-helpers-nextjs` to `@supabase/ssr` patterns. Give Claude the file and this prompt:

> "This file uses the deprecated `@supabase/auth-helpers-nextjs`. Rewrite it to use `@supabase/ssr` instead. For server components/actions/route handlers, use `createServerClient`. For client components, use `createBrowserClient`. Do not change any other logic. Reference CLAUDE.md in the repo root for the canonical pattern."

### Step 3.2: Find any Google Civic Representatives API usage (the CRITICAL one)

```bash
grep -rn "representativeInfoByAddress\|representativeInfoByDivision" --include="*.ts" --include="*.tsx" .
```

Expected output: nothing.

**If matches found:** You've found dead code. That API was shut down April 30, 2025. Each match needs to be replaced with the Congress.gov + geocoding pattern documented in `ARCHITECTURE.md` (Flow 2).

Do NOT try to "fix" these in a vibe session. Instead:
1. Note the file paths
2. Open a new Claude Code session
3. Start the session with "Read CLAUDE.md, FEATURES.md, and ARCHITECTURE.md. Then look at [these file paths]. The Google Civic Representatives API is dead. Rewrite these files to use the Congress.gov + Divisions API flow documented in ARCHITECTURE.md Flow 2."

### Step 3.3: Find any Stripe references

```bash
grep -rn "stripe\|Stripe" --include="*.ts" --include="*.tsx" .
```

Expected output: nothing, or only references in files you're about to delete.

**If matches found:** These are leftover scope creep. Either delete the entire file if it's clearly payment-related (e.g., `app/api/stripe/*`, `app/pricing/*`) or ask Claude Code to remove the Stripe-specific logic while preserving any non-payment code in the file.

### Step 3.4: Find any state-level / LegiScan references

```bash
grep -rn "legiscan\|LegiScan\|LEGISCAN" --include="*.ts" --include="*.tsx" .
```

Expected output: nothing.

**If matches found:** Same treatment as Stripe. Delete files that are purely state-bill related. Remove state-bill logic from files that mix concerns.

### Step 3.5: Find any Twilio references (should not exist, verifying)

```bash
grep -rn "twilio\|Twilio" --include="*.ts" --include="*.tsx" .
```

Expected output: nothing.

**If matches found:** Delete. MVP uses `tel:` links, nothing more.

### Step 3.6: Quick sanity check on file structure

```bash
ls app/
```

Expected output: directories for each route. For an MVP of this scope, you'd expect something like: `api/`, `login/`, `signup/`, `onboarding/`, `feed/` or `bills/`, `profile/`, `page.tsx`, `layout.tsx`, `globals.css`.

If you see directories like `dashboard/pricing/`, `api/stripe/`, `api/legiscan/`, those are scope creep artifacts. Flag them for deletion but don't delete yet — we'll commit them as a separate step.

---

## Phase 4 — Clean Up .env.local.example (5 min)

### Step 4.1: Open `.env.local.example` in your editor

### Step 4.2: Delete these sections entirely

```
# Google Civic Information API
# Get at: https://console.cloud.google.com → Enable "Google Civic Information API"
GOOGLE_CIVIC_API_KEY=your-google-civic-api-key

# LegiScan API (state bill tracking)
# Get at: https://legiscan.com/legiscan
LEGISCAN_API_KEY=your-legiscan-api-key

# Stripe (freemium/premium payments)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Step 4.3: Rewrite the Google Civic section (you still need it, but only for Divisions)

Add back a Google Civic section, but explicitly note what it's for:

```
# Google Civic Information API (DIVISIONS endpoint ONLY)
# The Representatives endpoint was shut down April 30, 2025 — do not use.
# We use the Divisions API for geocoding address → Open Civic Data ID.
# Get at: https://console.cloud.google.com → Enable "Civic Information API"
GOOGLE_CIVIC_API_KEY=your-google-civic-api-key
```

### Step 4.4: Also update your actual `.env.local` file

Open `.env.local` (which is gitignored, different from `.env.local.example`) and remove the same Stripe and LegiScan keys. Do NOT commit `.env.local`.

---

## Phase 5 — Verify Tailwind Setup (5 min)

### Step 5.1: Confirm postcss.config.js is v3-shaped

```bash
cat postcss.config.js
```

Expected output: something like

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**If instead you see** `'@tailwindcss/postcss': {}` **in the plugins**, that's the v4 plugin. Change it to `tailwindcss: {}` as shown above.

### Step 5.2: Confirm globals.css uses v3 directives

```bash
grep "@tailwind\|@import" app/globals.css
```

Expected output: three lines with `@tailwind base;`, `@tailwind components;`, `@tailwind utilities;`.

**If instead you see** `@import "tailwindcss";` (a single line) **that's the v4 syntax.** Replace with the three v3 directives above.

### Step 5.3: Run dev server to verify styling works

```bash
npm run dev
```

Open `http://localhost:3000` in a browser. If you can see styled content (even broken functionality is fine — we're checking CSS), you're good.

Press `Ctrl+C` to stop the dev server.

**If styles are broken or missing:** Something is off between `package.json`, `postcss.config.js`, and `globals.css`. Paste all three file contents back into Claude and ask for a reconciliation.

---

## Phase 6 — Commit and Push the Cleanup (10 min)

### Step 6.1: Review what you've changed

```bash
git status
```

You should see modified files (`package.json`, `package-lock.json`, `.env.local.example`, possibly `postcss.config.js`, possibly `app/globals.css`).

### Step 6.2: Stage and commit in logical chunks

Dependencies:
```bash
git add package.json package-lock.json
git commit -m "chore: remove out-of-scope and deprecated packages"
```

Env config:
```bash
git add .env.local.example
git commit -m "chore: remove out-of-scope env vars, clarify Google Civic usage"
```

Any Tailwind config fixes:
```bash
git add postcss.config.js app/globals.css
git commit -m "fix: reconcile Tailwind v3 config"
```

Any actual code changes from Phase 3 (if you did rewrites):
```bash
git add app/ lib/ components/
git commit -m "refactor: remove deprecated Google Civic Reps API usage, migrate to @supabase/ssr"
```

### Step 6.3: Push the branch

```bash
git push -u origin cleanup/pre-mvp-reset
```

### Step 6.4: Open a PR on GitHub

Go to your repo on github.com, you'll see a yellow banner suggesting a PR from `cleanup/pre-mvp-reset`. Open it. Even though you're solo, this gives you a Vercel preview URL to test before merging to `main`.

### Step 6.5: Verify the Vercel preview builds

Wait ~2 minutes. Vercel will post a comment on the PR with a preview URL. Click it. If the site loads (even partially, even with errors), the build succeeded. If you see a build-error page, go back to Phase 2.5.

### Step 6.6: Merge the PR

Once the Vercel preview loads, merge the PR on GitHub. Locally:

```bash
git checkout main
git pull origin main
git branch -d cleanup/pre-mvp-reset
```

---

## Phase 7 — Your First Session Under the New Discipline (15 min)

Now the payoff. You've done the cleanup. The next coding session should look completely different from the ones that burned you before.

### Step 7.1: Open Claude Code in your project

### Step 7.2: First message, verbatim:

> "Before we do anything, read CLAUDE.md, FEATURES.md, ARCHITECTURE.md, and SCHEMA.md at the repo root. Then run `git log --oneline -n 10` to see recent work. Then, without writing any code yet, summarize the current state of the project and identify what the next highest-value task is based on MVP scope in FEATURES.md. Wait for my confirmation before writing code."

### Step 7.3: Evaluate Claude's response

If Claude's summary:
- ✅ References specific features from FEATURES.md
- ✅ Mentions the Next.js 16 / proxy.ts distinction
- ✅ Doesn't suggest adding state bills, Stripe, or social features
- ✅ Proposes ONE next task, not five

→ You've successfully closed the context gap. Proceed with that task.

If Claude's summary:
- ❌ Suggests things not in FEATURES.md
- ❌ Doesn't reference the md files
- ❌ Proposes a big sprint of many features

→ Reply: "Please re-read CLAUDE.md carefully and try again. You didn't follow the session workflow in section 'Session Workflow'."

### Step 7.4: Pick the smallest possible unit of work for the next task

Whatever Claude suggests as the next task, negotiate it down. Say: "That's too much for one session. What's the smallest single unit of this — one route, one component, one function — that can be completed, tested, and committed in under 60 minutes?"

This is your new rhythm. One small, tested, committed unit per session.

---

## Phase 8 — What To Do Next (10 min read, no commands)

You've done the hard part. Here's what I'd do in your position, in order, over the next 2 weeks:

### Week 1: Solidify the Foundation

1. **Resolve any code you flagged in Phase 3** (deprecated API usage, scope-creep files). One branch per fix. One commit per branch.
2. **Write your first Playwright test** for the sign-up → onboarding → feed flow. Even if the flow is 50% broken, having a test is what lets you know when you break it further. Starter snippet at the bottom of this file.
3. **Verify your Supabase schema matches `SCHEMA.md`.** Run `supabase db pull` to see actual state vs. documented state. Create a migration to align them.
4. **Document your actual route structure** in `ARCHITECTURE.md` by running `find app -name "*.tsx" -o -name "route.ts" | sort` and capturing the output.

### Week 2: One Feature End-to-End

Pick ONE feature from FEATURES.md and do it completely:
- Schema ✅
- Backend (route handler or server action) ✅
- Frontend (UI) ✅
- Playwright test ✅
- Committed, deployed, working on Vercel ✅

My recommendation for the first end-to-end feature: **Feature 2 — Federal Representative Lookup.** It's the foundation everything else sits on, and it forces you to solve the geocoding + Congress.gov integration that the Google Civic deprecation created.

---

## Starter Playwright Test (for Phase 8 task 2)

Save this as `tests/signup.spec.ts` (you'll need to install Playwright first: `npm install --save-dev @playwright/test && npx playwright install`).

```typescript
import { test, expect } from '@playwright/test'

test.describe('New user signup flow', () => {
  test('can reach the signup page', async ({ page }) => {
    await page.goto('/signup')
    await expect(page).toHaveTitle(/Be The Change/i)
    await expect(page.getByRole('heading')).toBeVisible()
  })

  test('shows an error when submitting empty form', async ({ page }) => {
    await page.goto('/signup')
    await page.getByRole('button', { name: /sign up|create account/i }).click()
    // Adjust this assertion based on your actual error UI
    await expect(page.getByText(/email|required/i).first()).toBeVisible()
  })
})
```

Run it with `npx playwright test`. Commit even if it's the only test you have.

---

## If Anything In This Runbook Fails

1. **Do not improvise.** Do not try to "fix forward" by adding more changes.
2. **Revert the branch:** `git checkout main && git branch -D cleanup/pre-mvp-reset`, then start Phase 0 again.
3. **Paste the specific error output** into Claude Code with this prompt: "I'm on step [X.Y] of CLEANUP.md. Running [the command] gave me [the output]. What's the most likely cause and how do I safely proceed?"

Your branch is your safety net. Use it. This is the exact discipline that prevents the "three weeks of integration hell" failure mode from recurring.

---

## Success Criteria

You'll know the cleanup worked when all of these are true:

- [ ] `npm run build` completes with no errors
- [ ] `git log` shows 4+ new commits with clear messages
- [ ] `package.json` has no Stripe, no LegiScan, no deprecated Supabase auth helpers
- [ ] `.env.local.example` has no Stripe or LegiScan entries
- [ ] `grep -rn "representativeInfoByAddress" .` returns nothing
- [ ] Vercel preview build succeeds on the PR
- [ ] Your next Claude Code session starts with "Read CLAUDE.md" and produces focused, scope-aware suggestions
- [ ] The app still loads at `localhost:3000` with styles intact

When all eight boxes are checked, you have a clean foundation. Every future session builds on solid ground instead of quicksand.
