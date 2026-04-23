Read the following files in parallel, then produce a concise project-state summary:

- `CLAUDE.md` — coding rules, stack constraints, and hard "do not do" rules
- `FEATURES.md` — MVP feature list with acceptance criteria and what is explicitly out of scope
- `ARCHITECTURE.md` — stack, external APIs, and data-flow diagrams
- `SCHEMA.md` — Supabase table definitions, RLS conventions, and migration history

Also run `git log --oneline -10` to see recent commits.

Then output a summary with these sections (keep each tight — bullet points preferred):

## Project: Be The Change
One sentence on what the app does and who it's for.

## Current Phase
Where we are in the 6–8 week MVP timeline, based on recent git activity and feature completion.

## Stack Snapshot
Key tech choices with any critical "do not use X" warnings still in effect.

## Features: Status
For each MVP feature (1–7), one line: **name** — `done` / `in progress` / `not started`, plus a brief note on what's left if not done. Base this on code evidence (git log, what files exist) rather than assuming.

## Schema: Tables in Place
List tables that exist in `supabase/migrations/` with a one-line description.

## Open Constraints to Keep in Mind
The hardest "do not do" rules and any CLAUDE.md flags that are easy to violate (e.g., dead API endpoints, deprecated packages, caching requirements).

## Suggested Next Steps
Based on feature status, list the 2–3 most impactful things to tackle next toward a donor-ready MVP.
