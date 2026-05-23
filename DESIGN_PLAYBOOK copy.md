# Frontend Design Playbook

**Owner:** Colby **Purpose:** Single source of truth for the front-end / user-facing design phase. Built to give this phase the same anti-drift structure the build phase had — decisions front-loaded, work sequenced, output verified against reality. **Status when written:** Brand name NOT locked. This plan does brand-independent work in parallel and explicitly defers brand-dependent surfaces until the name lands.

**Status update (post-Batch 1):** Batch 1 system consolidation is COMPLETE and merged — fonts self-hosted via `next/font`, `slate-*` swept to tokens (192 → 3, the 3 being the excluded landing hero), raw sizes mapped to the type scale where tokens existed, `Input`/`Card` primitives adopted across forms and surfaces, app shell warmed to `bg-paper`, emoji replaced with lucide in scope. The split-brain is gone except for consciously-deferred residue (logged in `deferred.md`). **The project is now at the flagship-screen step: designing `/bills/[id]` (bill detail) to a high bar.** The consolidation items in the Pre-Flight Checklist below are done — treat them as ✅.

**Brand status (updated): NAME IS LOCKED → "Oravan".** Clearance checks done (2026-05-23):

- **USPTO: clear** — no conflicting trademark found (coined word). *Caveat: this is a database check, not formal legal clearance — a confusingly-similar-marks review by a lawyer is a pre-public-launch step, fold into the planned nonprofit-structure legal consult.*  
- **Domains: `.com` taken; `.org`/`.io`/`.dev`/`.app` available.** → **`oravan.org` is the chosen primary** — not a consolation prize: `.org` fits the civic / pro-democracy / planned-501c3 positioning and reads as more credible to the DC civic/donor audience than `.io`/`.app`. Grab `.io`/`.app` defensively if cheap. **Register `oravan.org` before the wordmark swap goes in.**  
- **Adjacent-name notes (no in-space conflict, logged for awareness):** "OravanOSA" is an FDA-cleared sleep-apnea oral-appliance brand (different industry, no confusion, but you'll share Google's first page until Oravan's own SEO grows); "orravan.ai" (double-r) is a mechanical/AI-engineering firm — not identical, mild reason to keep your own domain/usage clearly differentiated. The Finnish meaning ("of a squirrel") is harmless brand trivia.

What the lock unblocks: the wordmark text (replace "Be The Change" everywhere with Oravan), page titles, metadata, any copy referencing the old name. *Hold only the **public** rollout (landing live, announcement, anything printed) until formal legal clearance — internal build \+ design proceed now.*

**Still being discovered (NOT yet locked):** the visual identity — logo, and the **color palette**, specifically how bold `signal` (orange) gets and whether any color beyond the ink/paper neutrals is needed. **These are being discovered THROUGH the bill-detail exercise, not decided in the abstract first.** The neutral foundation (paper, ink, divider family) is settled and working; the open variable is the accent treatment. Bill-detail is dense with the elements that force this question (status pills, relevance badge, urgency signal, CTAs, links), so designing it *is* the palette exercise. Formalize the palette into the design-decisions doc *after* it's been validated on real content — record what works, don't guess upfront. Logo remains deferred (no logo design yet).

---

## How to use this doc

Read the Core Principle and Where You Are once. Then live in three sections: the **Pre-Flight Checklist** (what to gather/decide before starting), the **End-to-End Workflow** (how a single screen goes from rough to polished), and the **Guardrails** (how to not drift). The toolkit and reference sections are reference material — pull from them, don't read them every time.

The cadence mirrors the build phase: decide constraints → do one thing well → propagate → verify against rendered output every step. Don't skip to generating screens before the foundations are locked. That's how slop happens.

---

## 1\. Core Principle

**You don't have a design problem. You have a consistency problem.** This project already has a real, opinionated design system — someone made deliberate, good choices. The pages just don't use it. So the goal is *consolidation and restraint*, not reinvention. The anti-slop "tool" is not a plugin; it's three things:

1. **Constraints decided up front.** AI produces slop when asked to "make it look good" with no constraints, because it falls back on training-data defaults (Inter everywhere, purple gradients, nested cards, the rounded-icon-tile above every heading). You already have constraints (your token system). Use them as the cage.  
2. **Restraint.** Fewer fonts, fewer colors, fewer effects. The existing identity is editorial and warm — protect that by not adding novelty.  
3. **Looking at the rendered output.** Every iteration, at mobile (390px) and desktop. Most AI UI looks generic because nobody looks at it rendered — they read the code and assume. This is the single most important habit.

---

## 2\. Where You Are (the audit findings)

**The asset — a genuinely good design system that \~3 components actually use:**

- Warm paper background (`#F7F4EE`, not white), dark-green ink (`#1F2E2A`, not slate/black), an orange `signal` accent  
- Instrument Serif (headings) \+ Inter Tight (body) \+ JetBrains Mono  
- Full type scale (`text-display` / `h1` / `h2` / `h3` / …), tokenized radii / shadows / motion  
- Typographic niceties already set (`font-feature-settings: cv11, ss01, ss03, tnum`)  
- This is an **editorial, civic, warm** identity — the opposite of default-SaaS slop.

**The problem — the app is split-brained:**

- `slate-*` (generic gray): \~223 uses vs. design tokens: \~117  
- Raw font sizes (`text-2xl`, `text-3xl`): \~156 vs. the type scale (`text-h1`…): \~21  
- `lucide-react` is installed, but pages use emoji as icons (📋 📞 🗳️ 📬)  
- `themeColor: '#1d4ed8'` in `layout.tsx` — leftover blue that matches nothing in the palette  
- Fonts load via CSS `@import` (render-blocking \+ layout shift) instead of `next/font`

**Translation:** the good components (Button, ScriptFlow, CallFlow) honor the system; the pages (landing, auth, onboarding, dashboard, settings, representatives, NavBar, BillCard) are mostly generic Tailwind. The pages are the slop-looking part, and the fix is consistency, not creativity.

---

## 3\. The Brand-Lock Gate (read before starting)

The name "Be The Change" is retired; a new name/domain/logo is in progress. Front-end design is the most brand-dependent work there is, so split the work cleanly:

**SAFE to do now (brand-independent):**

- Kill the split-brain: `slate-*` → tokens, raw sizes → type scale, emoji → lucide, fonts → `next/font`, remove the leftover blue `themeColor`  
- Information architecture, layout density, interaction patterns, responsive structure  
- Hardening tokens into a documented primitive set  
- Leveling up non-identity-heavy surfaces (start: **bill detail**)  
- Empty / error / loading states  
- Gathering references, building taste, writing the design-decisions doc

**DEFER until brand locks (brand-dependent):**

- The wordmark / logo treatment and placement (every header \+ footer currently says "Be The Change")  
- The hero section on the landing page  
- *How boldly* `signal`\-orange gets used (wordmark, hero, primary CTAs) — this is the `brand-accent-color-pops` deferral  
- Any net-new user-facing copy or naming  
- **Do not start with the landing page** — it's the most brand-dependent surface and the worst place to invest pre-lock.

---

## 4\. The Toolkit (by layer — these solve different problems, they don't compete)

| Layer | What it's for | Your pick | Notes |
| :---- | :---- | :---- | :---- |
| **Build** | AI generates/edits real code in your repo | `frontend-design` skill as the spine | Detects & respects your existing tokens; verifies via screenshots. This is the build loop. |
| **Critique / audit** | AI (and deterministic rules) evaluate, don't build | **Impeccable** | `/critique` \+ `/audit` as periodic passes; the `detect` CLI as a slop linter. See §5. |
| **Reference / taste** | Calibrate "good" so it's concrete, not vibes | Mobbin \+ Refactoring UI \+ 2–3 editorial products | No AI. The most underrated layer. See §6. |
| **Primitives** | Pre-built accessible components | shadcn/ui — *later, deliberately* | Your cva+cn setup already IS the shadcn pattern. Adds Radix as a dep → needs explicit decision per CLAUDE.md. Adopt at first modal/toast need, not before. |
| **Verification** | Look at rendered output | Playwright (already wired) | Screenshot every surface at 390px \+ desktop, every iteration. The actual anti-slop mechanism. |

**Don't over-tool.** One build loop \+ Impeccable as periodic critique \+ Playwright verification. Running two design-vocabularies' worth of machinery at once is its own kind of slop (process slop).

---

## 5\. The Impeccable Workflow (highlighted)

Impeccable is a design *skill* that installs design vocabulary \+ an anti-pattern library into your AI harness (Claude Code, Cursor, etc.). It extends Anthropic's `frontend-design` skill. Its value for you is **critique and slop-detection**, not primary building — and critically, it **reads your existing tokens and stays inside your design system** rather than inventing a new one each run.

**Install (one command):**

npx skills add pbakaus/impeccable

Then run its teach/config step once so it learns your project's tokens and context (so every command has your `ink/signal/paper` system as context automatically).

**The commands you'll actually use (it ships \~20+):**

- `/critique` — genuine UX analysis: visual hierarchy, information architecture, cognitive load, emotional resonance. **Your most-used command. Run it early on each screen, before you over-invest.**  
- `/audit` — code-level design quality review with production-grade fixes.  
- `/polish` — refine an existing screen toward production quality.  
- `/distill` — simplify / strip an over-busy screen back to essentials.  
- `/bolder` and `/quieter` — push a screen's visual weight up or down without you needing the exact design vocabulary.  
- `/typeset` — typography pass (rhythm, scale, spacing).  
- `/arrange` — layout / spatial pass.  
- Steering commands like `/animate`, `/colorize`, `/delight` for targeted polish — use sparingly; restraint is the brief.

**The deterministic detector (no LLM, no API key — lean on this):**

npx impeccable detect

Scans HTML/CSS/JSX/TSX for \~27 known slop tells (purple gradients, side-tab cards, nested-card "cardocalypse," gradient text, low-contrast labels, Inter-everywhere, small touch targets, skipped headings). There's also a browser extension version. **Trust the detector over the LLM critique for "is this slop?" — deterministic rules don't hallucinate.** Run it as a linter against rendered pages.

**Critical limitation to internalize:** Impeccable is **single-generation** — each run is independent. It will NOT hold consistency across your whole app. *You* hold cross-screen consistency by feeding it your established patterns \+ the design-decisions doc (§ Guardrails) each time. This is exactly why the doc matters.

**Where it slots in the loop:** build a screen with the `frontend-design` skill → `npx impeccable detect` for cheap slop-check → `/critique` for the judgment pass → iterate → re-screenshot. Critique is a periodic audit, not a parallel workflow.

---

## 6\. Reference & Inspiration Sources (dedicated)

You can't ask AI for "good" in a vacuum — you have to *show* it a concrete target, or it fills the vacuum with its defaults. Pick 2–3 references, keep them open, and when you say "make it feel like X," X is a real screenshot.

**Pattern libraries (real product screenshots):**

- **Mobbin** *(you already use this)* — searchable real-app screenshots by pattern/flow. Best for "how do good apps handle a settings page / empty state / onboarding."

**Site / landing inspiration (curated galleries):**

- **Godly** (godly.website) — curated, high-taste site design.  
- **Land-book** (land-book.com) — curated landing pages, searchable by style/industry.

**Taste education (NOT AI — the highest-leverage item on this list for you):**

- **Refactoring UI** (refactoringui.com) — book/site by the Tailwind founders. This is *the* resource for a developer-without-formal-design-background, which is your exact situation. Every other tool here *amplifies* taste you already have; this one *builds* it. If you do one thing off this list beyond what you already use, do this.

**Editorial reference products (match your warm-editorial-civic identity — look at these, not SaaS dashboards):**

- The Browser Company's product/site (warm, crafted, restrained)  
- Stripe's documentation (information density done with grace)  
- Well-designed newspaper / magazine sites (editorial type, serif headings, generous rhythm) — your identity is closer to this than to any SaaS app.

**Gathered references (Colby's picks — what to take from each):** These are the active north-star set for the bill-detail work. Each note is the *specific* takeaway — the thing to emulate, not the whole site. Feed these to Claude Code as design direction for the flagship screen.

- **lovi.care** — onboarding flow, generous white space, the clean/unbusy/"pretty" feel, and a tasteful glass/depth effect. The strongest match for the calm, uncluttered direction the design system already leans toward. *Take: whitespace generosity, onboarding flow, restraint.*  
- **healthytogether.co** — a civic/health platform using genuinely modern design; the landing-page flow is the reference (note: it's a bit laggy — emulate the *look and flow*, not the performance). *Take: that a civic-category product can feel modern, not bureaucratic; landing flow.*  
- **amigo.ai** — fonts, color usage, and onboarding flow. *Take: type and color system feel, onboarding.*  
- **informed.so** — button design specifically. *Take: button treatment / component-level polish.*

**The through-line in these picks:** calm, modern, generous whitespace, editorial — not dense-SaaS. This is consistent with the existing token system (warm paper, editorial serif, restraint), which is a good sign: the references reinforce the identity rather than fighting it. When the creative-director ceiling pass runs, these are the calibration set for "is this distinctive enough" without drifting toward busy or trend-chasing.

**Sketch-only generators (use for ideas, NEVER as source of truth):**

- **v0 (Vercel), Lovable, Bolt, Subframe** — these generate UI from prompts, but against *their* training defaults, not your tokens. Importing their output \= importing slop you then fight. Legitimate use: when stuck on a *layout*, prompt one, look at 2–3 options, steal the *structure* you like, then rebuild it by hand in your system. Subframe is the most design-system-aware of these, but still treat output as a sketch. **Never let a generator export become a screen.**

---

## 7\. The End-to-End Workflow (how a single screen goes from rough to polished)

This is the loop you repeat per surface. Same rhythm as the build phase: small, verified, one thing at a time.

1. **Constrain.** Pull up your design-decisions doc \+ 1–2 references for this screen type. State the constraints to Claude Code explicitly (tokens only, type scale only, lucide icons, the reference feel).  
2. **Build / consolidate** the screen with the `frontend-design` skill, inside your tokens.  
3. **Screenshot** at 390px (mobile) and desktop via Playwright. *Look at it.*  
4. **Detect.** `npx impeccable detect` — cheap, deterministic slop-check. Fix what it flags.  
5. **Critique.** `/critique` for the judgment pass (hierarchy, IA, where it's weak). Iterate.  
6. **Polish** with targeted commands (`/typeset`, `/quieter`, `/distill`) — restraint, not novelty.  
7. **Re-screenshot.** Confirm it improved against reality, not in theory.  
8. **Record** any new pattern/decision in the design-decisions doc so the next screen inherits it.  
9. **Verify it didn't regress** existing Playwright specs (styling changes shouldn't, but confirm).

Do the **empty / error / loading states** of each screen, not just the happy path — that's the fastest way to make an app feel crafted rather than generic, because AI defaults to designing only the happy path.

---

## 8\. Pre-Flight Checklist (gather/decide BEFORE the first screen)

Don't start generating until these are in hand. This is the "constraints decided up front" step.

**Decisions to make (mostly brand-independent):**

- [x] Confirm the build spine: `frontend-design` skill installed/available  
- [x] Install Impeccable \+ run its teach/config so it learns your tokens *(installed; creative-director ceiling skill also installed at `~/.claude/skills/`)*  
- [x] Confirm Playwright can screenshot arbitrary routes at 390px \+ desktop *(used throughout Batch 1 — verified working)*  
- [x] Pick the **flagship screen** → **bill detail** (`/bills/[id]`), confirmed  
- [x] Choose your work mode → **in-code \+ screenshot loops**, confirmed

**References gathered ✅** (full set with per-site intent in §6):

- [x] Mobbin (in use)  
- [x] lovi.care, healthytogether.co, amigo.ai, informed.so — gathered with takeaways  
- [ ] *Optional, not blocking:* skim Refactoring UI principles (free Schoger talk \+ tips)

**Artifacts to create:**

- [ ] A **design-decisions doc** (extend `STYLE.md`, or a new `DESIGN_DECISIONS.md`) recording the *why* behind locked choices — why paper-not-white, why serif headings, density intent. Keeps screen \#6 consistent with screen \#1. *Worth creating early in the bill-detail session as decisions get made.*

**Now unblocked by the name lock (do these):**

- [ ] Register **`oravan.org`** (do this FIRST, before the wordmark swap)  
- [ ] Replace "Be The Change" wordmark/text with **Oravan** across nav, footer, titles, metadata, and any copy (standalone commit)  
- [x] USPTO checked — clear  
- [ ] Formal legal clearance (confusingly-similar review) — pre-public-launch, fold into nonprofit legal consult

**Still deferred until visual identity is settled (discovering via bill-detail):**

- [ ] Logo / icon mark (no logo yet)  
- [ ] Final `signal`\-orange boldness \+ whether any non-neutral color beyond signal is needed → being decided through bill-detail  
- [ ] Landing hero visual treatment (name/copy can update now; visual polish waits)

---

## 9\. First Sequence to Give Claude Code (the kickoff)

Once the checklist is in hand, this is the opening brief. It does the brand-independent consolidation first (foundation), then the flagship screen — same "foundation before features" discipline as the build phase.

**Frontend design phase — kickoff. Brand name is NOT locked, so this is brand-independent consolidation \+ one flagship screen. Defer anything touching the wordmark, logo, landing hero, or how-bold-signal-gets until I say the brand is locked.**

**Batch 1 — System consolidation (brand-independent, no new screens):**

1. Move font loading from the CSS `@import` to `next/font` (self-host/preload, kill the layout shift).  
2. Remove the leftover `themeColor: '#1d4ed8'` in `layout.tsx` (it matches nothing in the palette) — replace with the correct token or remove.  
3. Sweep `slate-*` → design tokens and raw font sizes (`text-2xl` etc.) → the type scale (`text-h1`…), across the pages (landing body, auth, onboarding, dashboard, settings, representatives, NavBar, BillCard). Do NOT touch wordmark/hero/logo treatment. Report a before/after count of `slate-*` and raw-size occurrences.  
4. Replace emoji icons (📋 📞 🗳️ 📬) with `lucide-react` equivalents.  
5. Harden the tokens into a small documented primitive set, extending the existing Button/cva pattern. Run lint \+ build \+ existing Playwright specs (styling-only, should pass unchanged — confirm no regression). Stop for my review before Batch 2\.

**Batch 2 — Flagship screen (bill detail), screenshot-verified:** Level the bill-detail page up to the bar set by ScriptFlow/CallFlow. Use Playwright to capture 390px \+ desktop screenshots every iteration and show them to me. Design the empty/error/loading states too, not just the happy path. Stay inside the tokens; restraint over novelty. Stop for review.

Before either batch, confirm you can read the existing `tailwind.config.ts` tokens and `globals.css`, and that you're using them as the constraint set — not introducing new colors/sizes.

After Batch 2, you propagate the established patterns screen by screen, running the §7 loop on each, feeding the design-decisions doc forward each time.

---

## 10\. Guardrails (how to not drift)

- **Foundations before screens.** Consolidation (Batch 1\) lands before any screen-leveling. Don't generate polished screens on top of a split-brain system.  
- **One screen to a high bar first, then propagate.** Don't spread thin across all pages. Bill detail → established patterns → next screen.  
- **Screenshot every iteration, at 390px \+ desktop.** Non-negotiable. If you didn't look at the render, you didn't verify it.  
- **The design-decisions doc is the memory.** Every locked choice goes in it. The build tool is single-generation; the doc is what makes screen \#6 match screen \#1.  
- **Restraint is the brief.** Fewer fonts/colors/effects. The identity is editorial and warm — adding novelty erodes it. When in doubt, `/quieter` and `/distill`, not `/bolder`.  
- **Brand-dependent work stays deferred** until you say the name is locked. If you find yourself wanting to design the wordmark or hero, stop — that's brand work.  
- **Detector before critique.** Cheap deterministic slop-check (`npx impeccable detect`) before the LLM critique pass.  
- **Same review cadence as the build phase.** Batches, stop for review between them, verify against rendered reality. The structure that caught regressions in the build is the structure that prevents drift here.

---

## 11\. What NOT to Do (the traps)

- Don't let a v0/Lovable/Subframe export become a real screen — sketch only.  
- Don't adopt shadcn/Radix speculatively — wait for the first real modal/toast need, decide it deliberately (CLAUDE.md dep rule).  
- Don't run two design vocabularies as parallel workflows — one build loop \+ periodic critique.  
- Don't start with the landing page — most brand-dependent, worst pre-lock investment.  
- Don't ask for "good" without a concrete reference — that's the vacuum AI fills with slop.  
- Don't design only happy paths — empty/error/loading states are where crafted-vs-generic shows.  
- Don't skip the screenshot because the code "looks right." The render is the truth.

---

## 12\. Open Threads (carry-over, not blocking design)

- **Brand lock** — the gate for the deferred surfaces. You'll signal when it lands.  
- **Anthropic spend cap** — still the one genuinely urgent non-design task; set it in the dashboard.  
- `untyped-browser-supabase-client`, `onboarding-skip-not-gated`, `email-verification-deferred` (pre-launch BLOCK) — tracked in `deferred.md`, not design-phase work, but live before public launch.

