# FEATURES.md

This file defines exactly what is and isn't in scope. When in doubt, the answer is "no, not this version."

---

## MVP Feature List (v1.0 — target 6–8 weeks)

### 1. User Account + Political Profile
**Acceptance criteria:**
- User can sign up with email + password (Supabase Auth)
- User can sign in, sign out, request password reset
- User has a profile with: full name, email, ZIP code, political values (multi-select from fixed list), issue priorities (ranked top 5 from fixed list)
- Profile is editable after creation
- User can delete their account (GDPR-style full delete)
- Email verification required before civic actions (calling, following bills) are enabled

### 2. Federal Representative Lookup
**Acceptance criteria:**
- Given a user's ZIP code (or full address for district-level accuracy), display their three federal reps: 1 House Representative, 2 Senators
- Display each rep's name, party, state, DC office phone number, and official photo if available
- Data source: Congress.gov API (NOT Google Civic Information API Representatives — that endpoint is dead)
- District lookup via geocoding → OCD-ID → Congress.gov
- Reps data cached server-side; refresh no more than once per week unless user manually updates address

### 3. Bill Feed (Filtered by User Priorities)
**Acceptance criteria:**
- Display a feed of active federal bills (introduced, in committee, on floor, up for vote)
- Each bill card shows: official title, short summary (LLM-generated or Congress.gov summary), sponsor, last action, relevance badge ("Matches your priorities on X")
- Feed is filtered and sorted by relevance to user's top 5 issue priorities
- "Follow" button adds bill to user's watchlist
- Data source: Congress.gov API, synced nightly via Vercel Cron, stored in Supabase
- Bill data cached; never call Congress.gov on page load

### 4. AI-Generated Call Script
**Acceptance criteria:**
- From a bill detail page, user clicks "Get my script"
- System generates a call script using Claude API, personalized with: user's values, stance on the bill (user-selected: support/oppose/undecided), bill summary, rep's name and party
- Script is displayed in an editable textarea with a "Make this yours" prompt
- User must click "Save & Review" before the "Call" button activates
- Generated scripts cached by `(user_id, bill_id, stance)` — never regenerate same tuple
- Every generation logged to `script_generations` table (anonymized)
- Scripts include a mandatory disclaimer in the UI (not the script text itself): "AI-drafted. Review and edit before use."
- Hard cost ceiling: $X/day spend cap on Anthropic API key (set in Anthropic dashboard)

### 5. 1-Click Calling
**Acceptance criteria:**
- On mobile: `<a href="tel:+1...">` link that opens the dialer with the rep's DC office number pre-filled
- On desktop: displays the phone number prominently with a "copy" button
- After user confirms they made the call (self-report), log a `call_event` with `(user_id, bill_id, rep_id, timestamp)`
- No Twilio. No server-side call connection. No recording.

### 6. Web Push Notifications
**Acceptance criteria:**
- On first visit after signup, prompt for push permission (with clear value prop: "Get notified when bills you follow have upcoming votes")
- VAPID keys stored in env (already wired)
- Max 2 pushes per user per day, enforced server-side
- Notification body contains NO political content — only neutral: "A bill you follow has an upcoming action. Open the app to see details."
- User can disable notifications in settings
- Timezone-aware delivery — no pushes between 9pm and 8am local time
- All pushes logged to `notifications_sent` table

### 7. Personal Activity Tracking
**Acceptance criteria:**
- User dashboard shows: bills followed, calls logged, scripts generated
- Purely personal view — no public profile, no sharing, no friend features
- Historical: user can see their call log with timestamps and which bill/rep each was for

---

## Explicitly DEFERRED (v2.0+, do NOT build now)

### Payments / Subscriptions
- No Stripe. No paid tiers. No "pro" features.
- Remove `STRIPE_*` from `.env.local.example` until v2.
- Remove `stripe` and `@stripe/stripe-js` from `package.json` until v2.

### State-Level Bills & Representatives
- No LegiScan. No Open States. No state-level lookups.
- Remove `LEGISCAN_API_KEY` from `.env.local.example` until v2.

### Social / Gamification
- No friend graphs, no leaderboards, no public profiles, no "challenges."
- Personal-only stats in v1. Social comes in v2 with moderation considerations.

### Native Mobile Apps
- iOS/Android native apps are v2+. MVP is web PWA only.
- No Expo, no React Native, no App Store submission.

### Twilio / Server-Side Calling
- MVP calls use `tel:` links only. No server-side call connection, no recording, no TCPA exposure.

### Email Outreach to Reps
- MVP is phone-only. Email advocacy (à la Resistbot) comes later.

### SMS Notifications
- Web push only for MVP. No Twilio SMS, no text-based interactions.

### AI Chatbot / Conversational Interface
- No "ask me anything about this bill" feature. Scripts only.

### Legislator Voting Records & Scorecards
- Showing how reps voted, scorecards, endorsements, etc. — all v2+.

---

## Anti-Scope-Creep Rules

1. If a request would add a feature not listed in "MVP Feature List" above, Claude must pause and ask: "This is out of MVP scope per FEATURES.md. Should we update FEATURES.md first, or defer this?"
2. Env vars for deferred features should NOT be present in `.env.local.example`. Their presence signals "build this."
3. New integrations (any new external service) require explicit human approval and an update to this file.
4. "Quick wins" that aren't in this list are not actually quick — they're scope creep wearing a disguise.

---

## Feature Acceptance Template

When a feature is considered "done," it must meet ALL of:

- [ ] Acceptance criteria above are met
- [ ] At least one Playwright test covers the happy path
- [ ] RLS policies exist for any new tables
- [ ] No TypeScript errors, no ESLint errors
- [ ] Manual QA on mobile viewport (Chrome DevTools device emulation) + desktop
- [ ] Env vars documented in `.env.local.example` if any new ones added
- [ ] Any new third-party service has been discussed and approved

---

## Post-MVP Roadmap (NOT a build plan — just capturing ideas)

**v1.1 (weeks 1–3 post-launch):**
- Bug fixes from beta feedback
- Performance tuning based on actual traffic
- Abuse controls hardened (rate limits, CAPTCHA on signup)

**v2.0 (post-fundraise):**
- State bills & state reps (LegiScan or Open States)
- Native mobile apps (Expo)
- Social features (friends, challenges) with full moderation plan
- Email outreach to reps
- Legislator voting records
- Premium tier (Stripe, if monetization model is clear)

**v3.0+:**
- Local government (city council, school board)
- Direct meeting scheduling with rep offices
- Town hall / event discovery
