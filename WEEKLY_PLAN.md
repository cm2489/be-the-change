# Be The Change — Weekly Build Plan

**Owner:** Colby
**Cadence:** Revised every Monday (30-min ritual)
**Companion to:** `STRATEGY.md` (north star, stable) | `CLAUDE.md`, `FEATURES.md`, `ARCHITECTURE.md`, `SCHEMA.md` (in-repo context)

---

## How to Use This Document

### Every Monday (30 minutes)

- **Review last week** — Check every box you completed. For anything unchecked, write one sentence on why (below the week's section, under "Notes").
- **Adjust this week** — Look at the plan for the coming week. Anything unrealistic given last week's progress? Adjust now, not midweek.
- **Confirm one priority** — Pick THE most important thing to ship this week. If everything else slips, this doesn't.
- **Check the budget line** — Spending on track?
- **Log any decisions** in `STRATEGY.md` Section 11 (Decision Log).

### Daily

- Morning: 5-minute review of this week's list. What am I working on today?
- End of day: Check off what's done. No cheating — "mostly done" isn't done.

### End of each week

- Two-line reflection: What worked? What didn't?

---

## The 8-Week Plan at a Glance

| Week | Theme | Primary Deliverable |
|---|---|---|
| 1 | Foundation cleanup | Clean repo, working auth, one feature end-to-end |
| 2 | Core data layer | Bill sync + rep lookup working in production |
| 3 | AI script generation | End-to-end: pick bill → generate script → review → log call |
| 4 | Feed & filtering | Personalized bill feed filtered by user priorities |
| 5 | Notifications & polish | Push notifications working, top UI pass |
| 6 | Closed beta | 50+ DC beta users, feedback captured |
| 7 | Bug fixes & launch prep | All P1 bugs fixed, launch assets ready |
| 8 | Soft launch | Public launch in DC network, fundraise conversations begin |

---

## Week 1: Foundation Cleanup (Days 1–7)

**Primary deliverable:** Clean repo with working sign-up → profile → rep lookup flow, one Playwright test passing, no deprecated APIs.

**This week's THE priority:** Complete the cleanup runbook. Everything else is negotiable.

### Cleanup (Day 1)

- Complete all phases of CLEANUP.md
- All four `.md` context files committed to repo
- Deprecated packages removed (`auth-helpers-nextjs`, `@tailwindcss/postcss`, Stripe)
- `.env.local.example` cleaned up (no Stripe, no LegiScan)
- Google Civic Representatives API usage eliminated
- `npm run build` passes
- Vercel preview deploys cleanly
- Merge cleanup PR to main

### Supabase alignment (Day 2)

- Run `supabase db pull` to capture current schema
- Compare actual schema vs. `SCHEMA.md`
- Create migration to align the two
- Verify RLS is enabled on every user-data table
- Apply migration to Supabase production

### First end-to-end feature: Federal rep lookup (Days 3–5)

- Implement geocoding address → OCD-ID (Google Divisions API)
- Implement Congress.gov lookup for reps by district
- Build `representatives` and `user_representatives` table writes
- Create UI: address input → reps displayed with names, parties, phone numbers
- Add loading and error states
- Write one Playwright test covering the happy path (sign up → enter ZIP → see reps)

### Supporting tasks (Days 6–7)

- Install Playwright (`npm install --save-dev @playwright/test && npx playwright install`)
- Create `docs/solutions/` directory and write first solution doc (Google Civic migration)
- Commit one clean feature branch per logical unit of work
- Set Anthropic API daily spend cap in dashboard
- Set up email for weekly donor check-in (no asks yet, just updates)

### Week 1 budget check

- Infrastructure spend on track (~$30 setup costs)
- No unexpected API charges

### End-of-week reflection (Sunday)

- What worked:
- What didn't:
- One thing to do differently next week:

---

## Week 2: Core Data Layer (Days 8–14)

**Primary deliverable:** Nightly bill sync running, bill data in Supabase, user can view a bill detail page with real data.

**This week's THE priority:** Bill sync cron job running reliably and populating the `bills` table.

### Bill sync (Days 8–10)

- Implement `/api/cron/sync-bills` route handler
- Connect to Congress.gov API, fetch recently-updated bills
- Upsert to `bills` table
- Track status changes in `bill_actions` table
- Verify `CRON_SECRET` auth protects the endpoint
- Test manually via curl, then trigger via Vercel Cron
- Write solution doc on any hiccups

### Bill detail UI (Days 11–12)

- Create `/bills/[bill_id]` route
- Display title, summary, sponsor, last action, status
- Add "Follow" button → writes to `followed_bills` table
- Add Playwright test for view bill → follow flow

### AI bill summarization (Days 13–14)

- Implement Claude API call for plain-English bill summary
- Cache summary in `bills.ai_summary` column
- Display alongside official summary on bill detail page
- Log generation to `script_generations` table (same pattern as scripts)

### Supporting tasks

- Run first `/workflows:review` on the sync-bills PR (limit to 2–3 reviewers)
- Ask the three questions on any AI output: hardest decision, alternatives rejected, least confident
- Update `ARCHITECTURE.md` with any flow changes discovered this week

### Week 2 budget check

- Anthropic spend reasonable (should be <$20 if caching works)
- Congress.gov API usage within rate limits

### End-of-week reflection

- What worked:
- What didn't:
- One thing to do differently:

---

## Week 3: AI Script Generation (Days 15–21)

**Primary deliverable:** User can visit a bill, select a stance, generate a personalized script, review/edit, and log a call.

**This week's THE priority:** End-to-end script generation with mandatory user review step working.

### Script generation backend (Days 15–16)

- Server action: `generateScript(bill_id, stance)`
- Cache check on `(user_id, bill_id, stance)` in `script_generations`
- Prompt construction: user profile + bill summary + stance + rep info
- Anthropic API call with error handling
- Log generation to `script_generations` (tokens, cost, hash)
- Return cached script on subsequent calls

### Script UI (Days 17–18)

- Stance selector (support / oppose / undecided)
- "Generate my script" button → shows loading state
- Editable textarea with generated script
- Mandatory "Save & Review" button before "Call Now" activates
- AI disclaimer copy: "AI-drafted. Review and edit before use."

### Calling flow (Days 19–20)

- Mobile: `tel:` link with rep phone number
- Desktop: phone number displayed prominently with copy button
- Post-call confirmation modal: "Did you make the call?"
- Log to `call_events` table on confirmation
- Update user dashboard stats

### Tests & polish (Day 21)

- Playwright test: view bill → generate script → review → log call
- Verify caching works (second generation returns instantly)
- Manual QA on mobile viewport

### Supporting tasks

- Write solution doc: any prompt engineering lessons from script generation
- Schedule legal consult for Week 3 or 4 (nonprofit structure decision)

### Week 3 budget check

- Legal consult booked (~$300–500)
- Anthropic spend trending reasonable

### End-of-week reflection

- What worked:
- What didn't:
- One thing to do differently:

---

## Week 4: Feed & Filtering (Days 22–28)

**Primary deliverable:** User sees a personalized feed of bills filtered by their issue priorities.

**This week's THE priority:** Feed ranking logic that actually surfaces relevant bills.

### Issue taxonomy (Day 22)

- Finalize fixed list of issue tags (immigration, healthcare, climate, etc.)
- Document in `ARCHITECTURE.md`
- Update `profiles.issue_priorities` to use canonical tags

### Bill classification (Days 23–24)

- LLM pass on existing bills: classify into issue tags → write to `bills.issue_tags`
- Batch processing script (one-time, can run manually)
- Add classification step to nightly sync for new bills

### Feed UI (Days 25–27)

- Create `/feed` route
- Query bills filtered by user's top 5 issue priorities
- Card layout with title, summary, relevance badge, status
- "Follow" button inline
- Empty state: "No bills matching your priorities yet"
- Pagination or infinite scroll (pick one)

### Tests & QA (Day 28)

- Playwright test: feed loads with correct filtering
- Test with different user profiles to verify personalization
- Mobile responsiveness check

### Supporting tasks

- Legal consult held, decision logged in `STRATEGY.md` Decision Log
- Mid-build reflection: is scope still realistic? Any cuts needed?

### Week 4 budget check

- Half of MVP timeline complete — budget on track?
- On-call engineer engaged yet? If no issues, save the $500 for later.

### End-of-week reflection

- What worked:
- What didn't:
- One thing to do differently:

---

## Week 5: Notifications & Polish (Days 29–35)

**Primary deliverable:** Push notifications working end-to-end, top-priority UI polish complete.

**This week's THE priority:** Push notifications delivering reliably without annoying users.

### Push notifications (Days 29–31)

- Web Push subscription flow on first login (with clear value prop)
- Save subscription to `push_subscriptions` table
- Build notification sender service
- Rate limiting: max 2/day/user enforced server-side
- Timezone-aware: no pushes between 9pm–8am local
- Trigger: bill user follows moves to "pending vote" status
- Neutral notification body (no political content in the notification text itself)
- Log to `notifications_sent` table

### UI polish pass (Days 32–34)

- Empty states on all pages
- Loading states on all async actions
- Error states with helpful messages
- Spacing and alignment audit
- Mobile responsiveness check on all pages
- Accessibility: keyboard nav, focus states, alt text

### Abuse surface hardening (Day 35)

- Rate limits on script generation (per user per hour)
- Rate limits on rep lookup endpoint
- Plan CAPTCHA integration for next week (don't block)
- Email verification enforced before civic actions

### Week 5 budget check

- Still under $5K personal investment?
- Anthropic spend under $100/mo

### End-of-week reflection

- What worked:
- What didn't:
- One thing to do differently:

---

## Week 6: Closed Beta (Days 36–42)

**Primary deliverable:** 50+ beta users from DC network, structured feedback captured, top 5 bugs prioritized.

**This week's THE priority:** Get real humans using the product and tell you what's broken.

### Beta prep (Days 36–37)

- CAPTCHA/Turnstile on signup
- Feedback mechanism in-app (Typeform embed or similar)
- Analytics events for key actions (sign-up, bill-follow, script-generate, call-log)
- "Known issues" document in-app for beta users
- Beta invite email draft

### Beta launch (Days 38–40)

- Send personal emails to 50+ DC contacts
- Approach 1 civic org for partnership test (Code for DC, New America, etc.)
- Respond to every beta user within 24 hours
- Daily bug triage: label P1/P2/P3

### Feedback synthesis (Days 41–42)

- Compile feedback into themes
- Prioritize top 5 issues to fix before launch
- Note quotable testimonials (with permission) for fundraising deck
- Decision: what ships at launch vs. gets pushed to v1.1?

### Supporting tasks

- Start fundraising deck draft (no outreach yet)
- Landing page copy v1

### Week 6 budget check

- On-call engineer engagements to date? Remaining budget?
- Beta running cost visible in dashboards

### End-of-week reflection

- What worked:
- What didn't:
- One thing to do differently:

---

## Week 7: Bug Fixes & Launch Prep (Days 43–49)

**Primary deliverable:** All P1 bugs fixed, landing page live, launch assets ready (video, screenshots, deck).

**This week's THE priority:** Everything on the P1 bug list closed. No P1 ships.

### Bug fixes (Days 43–45)

- P1 bugs fixed and verified
- P2 bugs triaged — fix or defer to v1.1
- Regression test pass on Playwright suite
- Manual QA on full user journey

### Launch assets (Days 46–48)

- Landing page polished (hero, value prop, CTA, beta testimonials)
- Launch video (1–2 min, screen recording + voiceover)
- Screenshot gallery for deck
- Fundraising deck draft complete
- Share strategy: which DC influencers/orgs get the early heads-up

### Legal & logistics (Day 49)

- Nonprofit structure formalized (if still pending)
- Privacy policy and ToS drafted and linked
- Payment processing for future donations set up (even if not accepting yet)

### Week 7 budget check

- On track for launch within personal investment ceiling?
- Any last contractor hires needed?

### End-of-week reflection

- What worked:
- What didn't:
- One thing to do differently:

---

## Week 8: Soft Launch (Days 50–56)

**Primary deliverable:** Public launch in DC network, first fundraise conversations.

**This week's THE priority:** Get the product in front of 500+ people. Monitor. Respond.

### Launch (Days 50–52)

- Launch announcement to full DC network (email, LinkedIn, Twitter)
- Coordinate with 3–5 partner orgs/influencers for signal amplification
- Monitor signup rate, error rate, API costs live
- Respond to every piece of feedback within 24 hours

### Fundraise kickoff (Days 53–55)

- Send personalized outreach to 10–15 prospective donors with deck + product link
- Book first fundraise meetings
- Track responses in a simple spreadsheet
- Prepare answers to expected hard questions (legal structure, revenue model, scale, moat)

### Retrospective (Day 56)

- 8-week retrospective — what got built, what worked, what didn't
- Update `STRATEGY.md` Decision Log with any major learnings
- Draft v1.1 priorities based on launch feedback
- Take a day off. Seriously.

### Week 8 budget check

- Total personal investment tally
- Monthly ongoing costs baseline established
- Fundraise targets confirmed for next phase

### End-of-week reflection (and end of MVP phase)

- What worked across 8 weeks:
- What didn't:
- Lessons for v1.1 build:

---

## Weekly Notes Archive

Use this section to capture anything that doesn't fit elsewhere: volunteer offers, donor conversations, technical decisions worth remembering, bugs that almost shipped, wins worth celebrating.

### Week 1 Notes

- [add during week]

### Week 2 Notes

- [add during week]

### Week 3 Notes

- [add during week]

### Week 4 Notes

- [add during week]

### Week 5 Notes

- [add during week]

### Week 6 Notes

- [add during week]

### Week 7 Notes

- [add during week]

### Week 8 Notes

- [add during week]

---

## Rolling To-Do (Things That Don't Fit a Specific Week)

Use this for tasks that matter but aren't time-critical. Review during Monday ritual and pull into a specific week when it makes sense.

- Set up a proper password manager if not already using one (1Password, Bitwarden)
- Decide on brand voice guidelines (formal/informal, civic/corporate, etc.) and document in `copy-voice.md`
- Explore partnerships with voter engagement orgs (League of Women Voters, When We All Vote)
- Research DC civic tech meetups for networking
- Start a private "build in public" log for future content/credibility
- Find the right lawyer if 1-hour consult goes well (ongoing counsel)

---

## Monday Ritual Checklist

Copy this checklist every Monday. Takes ~30 min.

- [ ] Reviewed last week's boxes. Noted what slipped and why.
- [ ] Scanned this week's plan. Adjusted anything unrealistic.
- [ ] Picked THE priority for this week (write it here: ___________)
- [ ] Checked budget line against last week's spend.
- [ ] Logged any major decisions in `STRATEGY.md` Section 11.
- [ ] Added 1–3 items to Rolling To-Do if they came up.
- [ ] Took a breath. Made coffee. Got to work.

---

## When to Update This Doc

**Update weekly:** Checkboxes, notes, reflections. The whole point.
**Update mid-week:** Only if you hit a hard blocker that moves a priority. Don't re-plan the whole week on a Wednesday.
**Update the 8-week structure:** If one full week slips, reshuffle the remaining weeks in the next Monday ritual. Don't pretend everything is fine.

**Do NOT update:** When you're frustrated, when you're tired, or on Friday night. Monday mornings only.
