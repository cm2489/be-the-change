# LEARNING_LOG.md

A living record of coding concepts encountered during the Be The Change build.
Written for someone building their intuition, not just copying commands.

**How to use this:** Read entries after a session, not during. The goal is to
build mental models you can carry into the next session independently.
New entries are added at the end of each session with the date and topic.

---

## Session 1 — April 23, 2026
### Foundation Cleanup & Schema Alignment

---

### 1. What File Ownership Means on Mac (and Why `sudo chown` Fixed It)

**What happened:** `npm install` failed with `EACCES: permission denied` and suggested running `sudo chown -R 501:20 "/Users/colbymaxwell/.npm"`.

**Why it works this way:**
Every file on your Mac has an "owner" — a user account that's allowed to read and write it. When you install things with `sudo` (which runs as the system's root user instead of you), the files created become owned by root, not by your account. Later, when you try to use those files as yourself, the system says "you don't own these, you can't touch them."

The `chown` command changes ownership. `sudo chown -R 501:20` means "change the owner of these files to user ID 501 (that's you, Colby) and group 20." The `-R` means do it recursively — every file inside that folder.

**Mental model:** Think of it like a filing cabinet. Someone accidentally put your files in a drawer that only the building manager can open. `chown` transfers the drawer back to you.

**Where this shows up again:** Any time you mix `sudo npm install` with regular `npm install`, or install something as an admin vs. as yourself. Rule of thumb: never use `sudo` with `npm`. If npm asks you to, something else is wrong.

---

### 2. What a Git Branch Actually Is

**What happened:** We created a `cleanup/pre-mvp-reset` branch, did all our work there, then merged it to `main` via a Pull Request.

**Why it works this way:**
A branch is a parallel copy of your entire codebase at a point in time. When you create one, you're saying "let me try something here without touching the version everyone else (or in your case, Vercel) is using." Changes on a branch stay on that branch until you deliberately merge them.

`main` is your "production" branch — it's what Vercel deploys. You never work directly on `main` because if something breaks, it breaks live. Branches are your sandbox.

A Pull Request (PR) is just a formal way of saying "I'd like to merge my branch into main — here it is for review." Even when you're solo, PRs are valuable because Vercel automatically builds a preview URL for every PR, letting you verify before merging.

**Mental model:** `main` is the published book. A branch is a draft chapter. You edit the draft freely, and only when it's right do you add it to the book.

**Where this shows up again:** Every single feature from here on. One branch per feature is the rule. You'll create a new branch before Day 3's rep lookup work.

---

### 3. Why We Verified the Build After Every Single Deletion

**What happened:** After deleting `lib/legiscan.ts`, we ran `npm run build`. After removing 5 lines from `sync-bills/route.ts`, we ran `npm run build` again. After deleting the `/callenge` directory, we ran it a third time.

**Why it works this way:**
A "build" compiles your entire codebase — it checks every file, every import, every TypeScript type. If anything is broken, it tells you exactly what and where. By running it after each change, you know *which specific change* caused any problem. If you make five changes and then build, and it fails, you have to guess which of the five broke it.

This is called "bisecting" the problem space — you're keeping the known-good state as close to the present as possible.

**Mental model:** Imagine you're defusing wires on a bomb. You cut one wire, step back, check nothing exploded, then cut the next one. You don't cut all five at once and hope for the best.

**Where this shows up again:** Every cleanup, every refactor, every time you remove or rename something. Build after each meaningful change. It costs 30 seconds and saves hours.

---

### 4. What Row Level Security (RLS) Is and Why Every Table Needs It

**What happened:** Every table in `002_align_to_schema.sql` had `ALTER TABLE x ENABLE ROW LEVEL SECURITY` followed by policies like `USING (auth.uid() = user_id)`.

**Why it works this way:**
Supabase exposes your database directly to your frontend via an API. Without RLS, any logged-in user could theoretically query any row in any table — including other users' data. RLS adds a filter at the database level: before returning any row, Supabase checks the policy. `USING (auth.uid() = user_id)` means "only return this row if the currently logged-in user's ID matches the `user_id` column."

This is security at the data layer, not the application layer. Even if someone bypasses your frontend and queries Supabase directly, they only get their own rows.

**Mental model:** RLS is like a bank vault where every safety deposit box only opens for its owner. Even if someone gets into the vault room, they can only access their own box. Without RLS, the vault room is open and all the boxes are unlocked.

**Where this shows up again:** Every new table you create needs RLS enabled and policies defined in the same migration. We have a template for this in `SCHEMA.md`. Never create a table without it.

---

### 5. What a Database Migration Actually Is

**What happened:** We created `supabase/migrations/002_align_to_schema.sql` — a SQL file that drops old tables and creates new ones. Then we ran `supabase db push` to apply it to the live database.

**Why it works this way:**
A migration is a versioned, reproducible change to your database schema. Instead of clicking around in the Supabase dashboard (which creates changes with no record), you write the change as SQL in a file, commit it to git, and apply it with a command.

This means your database structure is version-controlled just like your code. If something goes wrong, you can see exactly what changed and when. If you ever need to set up a new database (for testing, for a new team member, for disaster recovery), you just run all the migrations in order and you have an identical database.

The numbering (001, 002) ensures they always run in the right order.

**Mental model:** Think of migrations like a recipe card file. Each card is a step that transforms the database from one state to another. To recreate any version of the database, you just follow the cards in order. Clicking in a dashboard is like cooking without writing down the recipe — it works once, but you can never reproduce it.

**Where this shows up again:** Every schema change from now on goes through a migration file. Never alter tables directly in the Supabase dashboard. The rule: if it's not in a migration file, it didn't happen.

---

### 6. Why the Old Schema Had So Much Drift

**What happened:** The live Supabase database had tables (`callenges`, `callenge_participants`, `user_interests`, `rep_lookup_cache`) and columns (`stripe_customer_id`, `subscription_tier`, `source`) that weren't in `SCHEMA.md` and weren't in any MVP feature.

**Why it happens:**
When you build without scope discipline, the AI adds things "just in case." You asked for a bill feed, and the AI also added a Stripe customer ID because it assumed you'd want payments eventually. You asked for a user profile, and it added a `source` column to track where the rep data came from. Each of these was a reasonable guess — but none of them were decisions you made.

Over time these accumulate. The database drifts from the code. The code drifts from the plan. The plan drifts from reality. This is called "schema drift" and it's one of the most common ways projects become unmaintainable.

The fix — which we just did — is to treat `SCHEMA.md` as the single source of truth and periodically verify the live database matches it.

**Mental model:** Imagine you're building a house and every contractor who comes through adds a wall "just in case you want an extra room." After six contractors, you have a house full of walls you didn't plan and don't need, and the plumbing doesn't connect properly because it was designed for the original layout.

**Where this shows up again:** Every time Claude Code suggests adding something that isn't in `FEATURES.md` or `SCHEMA.md`, that's a drift opportunity. The context files prevent this by keeping the AI scoped. When Claude Code reads `FEATURES.md` and sees "state bills are v2+," it won't add LegiScan tables on its own.

---

### 7. What `git push` Actually Does — The Full Chain

**What happened:** We ran `git push origin main` and within 2 minutes Vercel had a new production deployment.

**Why it works this way:**
`git push` sends your local commits to GitHub. That's all it does — it copies your commit history from your Mac to GitHub's servers.

But Vercel is watching your GitHub repo. The moment a new commit lands on `main`, Vercel automatically pulls it, runs `npm run build`, and if it passes, deploys the new version to your production URL. This is called a webhook — GitHub tells Vercel "something changed," and Vercel responds.

The chain is:
```
Your Mac (source of truth)
    → git push → GitHub (backup + trigger)
        → webhook → Vercel (builds + hosts)
            → your users see the new version
```

**Mental model:** GitHub is the loading dock. Vercel is the store. When a new shipment (commit) arrives at the loading dock, the store automatically puts it on shelves. You only manage the shipping — the rest is automatic.

**Where this shows up again:** Every time you push to main, expect a Vercel deployment in ~2 minutes. This is also why you never push broken code to main — it deploys immediately. Always verify on a branch first.

---

### 8. Why We Committed in Logical Chunks Instead of One Big Commit

**What happened:** Instead of one commit for all cleanup changes, we made three:
1. `chore: remove out-of-scope and deprecated packages`
2. `chore: remove out-of-scope env vars, clarify Google Civic usage`
3. `refactor: remove LegiScan library, callenge social feature, and out-of-scope code`

**Why it works this way:**
Each commit is a snapshot you can return to. If something breaks after commit 3, you can roll back to after commit 2 and you still have the package cleanup. If you put everything in one commit and it breaks, you can only roll back to before any of it.

Commits are also documentation. Reading `git log` should tell a story of what changed and why. "cleanup everything" tells you nothing. The three messages above tell you exactly what category of change each commit contains.

The rule of thumb: one commit per logical unit of work. Package changes together. Config changes together. Code deletions together.

**Mental model:** Commits are save points in a video game. Saving after every level means you lose at most one level if you die. Saving only at the beginning means you lose everything. Small, frequent saves = small, recoverable losses.

**Where this shows up again:** Every session. Before you start any work, you should be able to describe what you're about to do in a single commit message. If you can't, the scope is too big — break it into smaller pieces.

---

### 9. What the Supabase MCP Connection Is and Why It's Powerful

**What happened:** When `supabase db pull` failed (because Docker wasn't installed), Claude Code pivoted and used the Supabase MCP to query the live database directly — running SQL like `SELECT table_name FROM information_schema.tables` to see what tables existed.

**Why it works this way:**
MCP (Model Context Protocol) is a way for Claude to connect to external services — in this case, your actual Supabase database. Instead of Claude guessing what's in your database based on code files alone, it can query it directly and get ground truth.

This is what allowed Claude Code to produce the detailed diff between your live schema and `SCHEMA.md` — it didn't infer it, it measured it. That's a fundamentally different and more reliable operation.

**Mental model:** The difference between a doctor asking "how do you feel?" versus running a blood test. Both give information, but one is subjective interpretation and one is direct measurement.

**Where this shows up again:** Whenever Claude Code needs to verify what's actually in your database vs. what you think is there. This is especially useful for debugging — if a feature isn't working and you're not sure why, Claude Code can query the database directly to see what data actually exists.

---

### 10. The Difference Between a Deprecated Warning and an Error

**What happened:** During `npm install`, we saw yellow warnings about `@supabase/auth-helpers-nextjs` being deprecated. These didn't stop the install or break anything.

**Why it works this way:**
Errors stop execution. Warnings are advisory. A deprecation warning means "this package still works, but the authors have stopped maintaining it and recommend switching to something newer." It won't break today, but it will eventually — either through security vulnerabilities going unpatched, or incompatibility with future versions of other packages.

That's why we removed it during cleanup even though it wasn't causing immediate problems. Deprecated packages are technical debt — they're fine today, costly tomorrow.

**Mental model:** A deprecation warning is like a "bridge weight limit" sign that your car still fits under — for now. Ignoring it is fine short term, but eventually a heavier load comes along and you have a problem.

**Where this shows up again:** `npm install` will occasionally show deprecation warnings. Don't ignore all of them — check if the deprecated package is something we depend on directly (in `package.json`) or just a transitive dependency (something our packages depend on). Direct dependencies are worth addressing. Transitive ones are usually fine to leave.

---

## How to Add to This Log

At the end of any session where something interesting was learned, tell Claude Code:

> "Add entries to `docs/LEARNING_LOG.md` for any meaningful concepts from today's session. Explain each one for someone building their coding intuition, not just copying commands. Include what happened, why it works that way, a mental model, and where it shows up again."

Then commit the updated file with the session's other changes.

---

*Last updated: April 23, 2026 — Session 1*
