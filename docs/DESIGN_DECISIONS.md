# Design Decisions

**Purpose:** The cross-screen memory for the front-end / design phase. The build tools (`frontend-design`, Impeccable) are **single-generation** — each run is independent and will not hold consistency across the app. *This doc* is what makes screen #6 match screen #1. Every locked design choice lands here with its **exact class string** and the **why** behind it, so the next screen inherits the decision instead of relitigating it.

- **Operating doc:** `docs/DESIGN_PLAYBOOK.md` (workflow, toolkit, guardrails, references).
- **Tokens (the cage):** `tailwind.config.ts` / `app/globals.css`.
- **This doc:** the locked decisions those produce.

**How to add an entry:** when a choice locks in the §7 loop, record it here — treatment, exact classes, why — *before* moving to the next slot/screen. Treat the class strings as load-bearing, not illustrative. Call out any arbitrary (non-token) value and link the `docs/deferred.md` item it belongs to.

**Conventions for this doc:**

- **LOCKED** = decided, rendered, signed off. Don't reopen without a note here.
- **Exact classes** are copy-paste accurate against the rendered, approved state — not a paraphrase.
- Arbitrary `[…]` values are flagged explicitly and cross-referenced to `docs/deferred.md` so they don't quietly scatter.

---

## Foundations (inherited — see `docs/DESIGN_PLAYBOOK.md` §1–§2, §7)

Not re-derived here; the playbook is the source. In one breath: a **warm, editorial, civic identity** — `paper` (`#F7F4EE`) not white, dark-green `ink` (`#1F2E2A`) not slate/black, Instrument Serif headings + Inter Tight body + JetBrains Mono. **The token system is the cage; restraint is the brief.** The bill-detail ceiling pass (2026-06-01) tested whether the screen needs any accent at all and **locked neutrals-only** (see the Ceiling pass section) — the old "how bold does `signal`-orange get" framing baked in an accent that was never actually chosen. Accent is decided **per-screen, never assumed**.

---

## Screen: Bill detail (`/bills/[id]`) — floor pass

Branch `feat/bill-detail-floor`, Batch 2. Source brief: `docs/bill-detail-floor-brief.md`. In-flight state: `docs/bill-detail-floor-handoff.md`.

**Composition: Option A — official title above, "Decoded" hero card below**, in a `max-w-3xl mx-auto px-4 py-6` column. Slots 4–6, the non-happy states, and the ceiling (color) pass are still open — only what is **LOCKED** is recorded below.

### Slot 1 — Status bar — LOCKED (2026-05-29)

**Treatment:** Ring-outline neutral pills + a mono citation identifier. Urgency, "Federal", and status read in **neutrals only** — `urgencyLabel().color` is deliberately *not* consumed (color is a ceiling decision, brief §4.5). No emoji (dropped the pre-floor 🇺🇸).

**Exact classes:**

- Pill (urgency + "Federal"): `inline-flex items-center px-2.5 py-0.5 rounded-pill border border-divider text-ink-70 text-meta uppercase`
- Identifier: `font-mono text-meta text-ink-50 ml-1` — content formatted as a Congress citation ("H.R. 4821" / "S. 1234") via the `billIdentifier()` helper, not a bare integer.

**Why:** A ring outline (not a fill) keeps status as quiet reference rather than a colored alarm, and neutrals prove the layout works before the palette exists. The mono identifier reads as a formal citation detail, subordinate to the title — reinforcing that the bill's official identity is *reference*, not hero.

### Slot 2 — Official title — LOCKED (2026-05-29)

**Treatment:** A sans uppercase "Official title" kicker over a serif-italic body. Settled after comparing 7 stacked variants (sans/serif/mono × size × labeled). The official title is deliberately the **cold, institutional register** — the citation, not the headline (brief §2).

**Exact classes:**

- Kicker: `text-meta uppercase tracking-widest text-ink-50 mb-1.5`
- Body: `font-serif italic font-medium text-[22px] text-ink-70 leading-relaxed tracking-[0.02em]` — element is **`<h1>`** (the page heading; restored from a bones-era `<p>` on 2026-05-30 to fix the heading hierarchy + the Feature 4/5 specs — visual is byte-identical, see slot 6)

**Why:** Serif italic in a tightened, tracked setting reads as formal citation form — accurate to what a federal bill *is* (procedural, excluding). Placing it under a small kicker and *below* the would-be hero inverts the instinct to lead with the official title; leading with the plain-language translation is the whole point of the product. `ink-70` (not full `ink`) keeps it present but secondary.

**✓ RESOLVED (ceiling pass, 2026-06-01):** the arbitrary `text-[22px]` and `tracking-[0.02em]` are **gone** — the ceiling quieted the title to on-token `text-h3` (18px) / `ink-50` (see the Ceiling pass section). No arbitrary type values remain on this screen.

### Slot 3 — "Decoded" hero card — LOCKED (surface + body + label + empty state)

**Surface treatment (LOCKED):** "Floating warmth" — a warm fill + soft shadow lift, **no border**, large radius, generous padding. Realizes the brief §4.1 "distinct-from-shell" intent via *depth* rather than a frame. Chosen from 4 surface variants (bordered editorial / floating warmth / sharp callout / spacious magazine).

**Exact surface classes:** `bg-paper-dark shadow-md rounded-xl px-8 py-9`

**Why:** `paper-dark` (`#EDE7D8`) reads warmer than both the `paper` app shell and the white (`card`) supporting surfaces, so the hero is the warm thing and its neighbors stay cool-white — the contrast that makes it *the hero*. `shadow-md` lifts it without a cold, rigid border; `rounded-xl` (20px) softens; the padding gives the translation room to breathe.

**Body treatment (LOCKED — picked A from a 3-way A/B/C render, 2026-05-29):** Sans (Inter Tight) at the readable measure, softened ink, loose leading.

**Exact body classes:** `text-body text-ink-85 leading-loose max-w-[65ch] mx-auto`

**Why A over the serif candidates (B/C):** The fork was framed as *family contrast vs warmth* (handoff §8). Sans **breaks from the serif-italic citation title**, so the plain-spoken translation reads in its own voice and the family contrast itself becomes the warm/cold signal — exactly the "Decoded = polar opposite of the cold institutional bill" concept. The serif candidates (which share the title's family) read as editorial coherence but blurred that distinction. Warmth here comes from `leading-loose` + `ink-85` + the warm surface, **not** the typeface — many subtle touches, no overt move. The card sits in a `mb-4` slot wrapper (not `mb-8`) so the relevance line (slot 4) hugs the card it explains.

**Label treatment (LOCKED — picked C from a 3-way quiet/present/editorial render, 2026-05-29):** "Editorial marker" — the centered meta-uppercase caption in deeper `ink-70`, with a short centered hairline rule beneath it.

**Exact label classes:**

- Wrapper: `text-center mb-5`
- Caption: `text-meta uppercase tracking-widest text-ink-70`
- Rule: `mx-auto mt-3 h-px w-8 bg-divider-strong`

**Why C:** `ink-70` fixes the baseline's faintness (`ink-50` nearly receded into the warm fill) so the label anchors as the card's title; the short `divider-strong` hairline (warm tan, 32px) adds an editorial magazine-kicker structure with no color and no glyph (icon system is brand-locked). It's the most "designed" of the three — a deliberate small warm touch consistent with the hero's accumulate-warmth-from-many-small-moves intent. Centered per brief §4.2 (label centered, body left).

**Empty state (LOCKED — picked B from a 3-way centered / left / centered-italic render, 2026-05-30; re-warmed 2026-05-30 after the /critique pass):** When `displaySummary` is null (no summary synced yet), the card / label / rule stay; only the body paragraph swaps to a warm, present reassurance line.

**Exact empty-body classes:** `text-body text-ink-70 leading-relaxed max-w-[65ch] mx-auto` — the **same `~65ch` left measure** as the filled body. **Copy:** "We're still translating this bill into plain language. A clear read is on the way."

**Why B (left at measure):** holding the empty body at the same measure + alignment as the filled body means the card **doesn't change shape** when it goes empty → decoded; only the text changes. (Centered variants read more like a conventional placeholder and make the card "jump" between states.) Implemented as a single conditional around the **body paragraph only** (card / label / rule render once, shared by both states).

**Re-warm (2026-05-30, /critique-driven, neutral — no color):** the original lock rendered the empty body at faint `ink-50` with terse "Not decoded yet" copy, which read as a cold *system placeholder* (critique [P2]) — the first-timer's weakest moment, since null-summary bills are common and that's exactly when the translation they came for is absent. Warmed **within the neutral palette only**: present `ink-70` (not faint), `leading-relaxed` breathing to match the filled body's voice, and kinder first-person copy. Color stays the ceiling's call.

### Concept (LOCKED) — "Decoded" as the warm polar opposite of the cold institutional bill

The **load-bearing thematic intent** for the Decoded card — the lens every slot-3 interior decision is judged through.

- The **bill itself is cold and institutional** — formal serif-italic citation title, procedural language, the H.R./S. identifier. That coldness is real and accurate to what a federal bill is.
- **Decoded is the polar opposite — warm, kind, plain-spoken.** That warmth is what makes the card the *hero* (translation, ease, "I see you" energy), not just its visual prominence.
- **Warmth comes from many SUBTLE touches combined, never one overt move** — warm fill, soft lift (no rigid border), centered editorial label, body confined to a ~65ch readable measure (`max-w-[65ch] mx-auto`), softened `ink-85` body ink. It should be **felt before named**; no single touch announces it.
- **Boundary:** warm-subtle is the *flavor*, not a license to break a floor lock. It does not override neutrals-only, no-`signal`-color, the ~65ch measure, or the centered-label/left-aligned-body mix. When a warm candidate fights a brief lock, **the brief wins**.

Full capture: project memory `project_decoded_card_warm_polar_opposite.md`. When proposing slot-3 interior variants, filter each through *"does this add a subtle warm note, or bring in cold institutional energy?"* — cold-clinical options only as explicit contrast baselines.

### Slot 4 — Relevance line ("Why this matters to you") — LOCKED (2026-05-30)

**Treatment:** A quiet supporting line **beneath** the Decoded card (not a second card), at the column's left edge — one consistent left margin runs card → relevance → metadata (brief §4.3). `text-small`, `ink-50`, low weight. Picked treatment **C** from a 3-way emphasis render (one-tone / area-bold / area-ink-only): the matched area is lifted with **ink alone** (`ink-85`, no weight bump) — guides the eye without the line getting loud.

**Three states (brief §4.4), driven by `resolveRelevance`:**

| State | Copy | Classes |
|---|---|---|
| populated | `Touches your priorities: {areas}` (comma-joined) | line `text-small text-ink-50`; matched area `text-ink-85` |
| empty | `Set your issue priorities to see why this matters to you.` | link `underline underline-offset-2 text-ink-70 hover:text-ink` → **`/onboarding`** (Next `<Link>`) |
| no-match | `This bill is outside your current priorities.` | `text-small text-ink-50` |

Wrapper: `mb-8 text-small text-ink-50`. The link is **neutral** (underline + ink) — link color is a ceiling decision, not the floor's.

**Matching semantics (the data decision — locked by `lib/__tests__/relevance.test.ts`):** a **raw intersection on top-level category ids** (`user_interests.category` ∩ `bills.issue_tags`), mirroring `get_personalized_feed` so the detail page and the feed badge can never disagree. The matcher does **not** walk subcategory → parent — the tagger guarantees `issue_tags` carries the parent whenever it emits a subcategory (STRATEGY.md 2026-04-28 rejected matcher-side parent-walking; the prior bug was the tagger emitting subcategories *without* parents). Consequence, pinned by the test: a **bare subcategory without its parent does not match** (malformed input, intended), and parent + subcategory + duplicates **collapse to one** (no double-counting). Logic + rationale: `lib/relevance.ts`.

### Slot 5 — Metadata row (last action · Full text) — LOCKED (2026-05-30)

**Treatment:** Picked **B (labeled, stacked)** from a 3-way (no-label one-row / labeled-stacked / labeled-inline-one-row). A top `divider` rule, then a "Last action" meta-label + a neutral external "Full text" link on one row, with the verbose `last_action_text` on its **own full-width line** below, clamped to one line.

**Exact classes:**

- Row wrapper: `mb-10 border-t border-divider pt-4`
- Label + link row: `flex items-baseline justify-between gap-6`; label `text-meta uppercase tracking-widest text-ink-50`; link `text-small text-ink-70 underline underline-offset-2 hover:text-ink` (`target="_blank" rel="noopener noreferrer"` → `congress_gov_url`)
- Action line: `text-small text-ink-70 line-clamp-1 mt-1.5`; content `{date} · {last_action_text}` (date via `formatDate`; falls back to "No recorded action yet." when text is null)

**Why:** Metadata is the quietest reference on the page — `text-small` + ink-tints + a single hairline divider keep it subordinate to the Decoded card and relevance line. Stacking gives the verbose committee-speak its own line so it never squeezes the link, and `line-clamp-1` honors brief §9 (`last_action_text` is metadata, not prose). The "Full text" link is **neutral** (underline/ink) — link color is a ceiling decision.

### Slot 6 — Call-script section ("Take action") — LOCKED (2026-05-30)

**Treatment:** Picked **B (top rule + kicker)** from a 3-way (kicker-only / rule+kicker / rule+kicker+lead-line). A top `divider` rule + a "Take action" meta-kicker frame the shipped `ScriptFlow` + `CallFlow` cards as a deliberate section (brief §5), reading intentionally **pre-save** (script card only) and **post-save** (CallFlow appears on the `scriptSaved` gate). The kicker is a `<p>`, **not a heading**, so it doesn't collide with the cards' own `<h2>`s or re-break the hierarchy. (C's lead line was dropped — the cards already self-describe.)

**Exact classes:** section `border-t border-divider pt-6`; kicker `text-meta uppercase tracking-widest text-ink-50 mb-4`; cards stack `space-y-4`. Copy: "Take action".

**Internals are off-limits.** `ScriptFlow`/`CallFlow` (shipped Features 4 & 5) are framed, not modified — the wiring (`onSavedChange` → `scriptSaved`/`scriptGenerationId`; the `{scriptSaved && <CallFlow>}` gate) is **behavior-identical to the pre-floor version**, restored verbatim from git history rather than reconstructed.

**Lock condition (both required, both met):** the section reads intentionally pre/post-save **and** the Feature 4 & 5 Playwright specs pass green again. Getting the specs green required restoring slot 2's title from the bones-era `<p>` back to **`<h1>`** (identical classes, identical look) — the bones pass had dropped the heading, breaking the specs' "page loaded" check and leaving the page with `<h2>`s under no `<h1>`.

### States (loading · not-found) — LOCKED (2026-05-30)

Non-happy states are part of the design, not cleanup (brief §6). The Decoded-empty, relevance 3-state, and call-shell pre/post-save states live in their slots above; the two full-screen early returns:

- **Loading — skeleton.** Pulsing neutral placeholders mirroring the locked layout (back · pills · title · Decoded card shape) so the real content doesn't pop in or shift. Classes: container `max-w-3xl mx-auto px-4 py-6 animate-pulse`; placeholders `bg-ink-10` with `rounded` / `rounded-pill`; the Decoded shape reuses `bg-paper-dark rounded-xl px-8 py-9`. Picked over a bare "Loading…" line — the skeleton is the more considered state.
- **Not-found — text-only, no emoji.** A "Not found" meta-kicker (echoing the screen's OFFICIAL TITLE / DECODED / TAKE ACTION vocabulary) + a `text-h3` message ("We couldn't find that bill.") + a **neutral** "Back to issues" link (`text-small text-ink-70 underline underline-offset-2 hover:text-ink` → `/bills`; no signal — same floor rule as the slot 4/5 links). Picked over a lucide-glyph variant to stay on the editorial vocabulary.

---

## Ceiling pass — LOCKED (2026-06-01)

Ran on `/bills/[id]` against real warmed summaries (`hr-8577`, the 262-char-title case). Co-designed via rendered fan-outs at 390 + desktop. Direction **D1 + air**.

### Accent / color — NONE (LOCKED)

**No accent color.** A 3-way fan-out — neutrals-only (A) vs the existing `signal` orange (`#E65A2B`, B) vs a teal alt (`#1C5F66`, C), all at the same placement (Decoded label + hairline + links) — read **~95% identical**: the accent did almost nothing here. **Neutrals carry it** (paper / ink / divider); the screen reads as a calm editorial article, which is the intent. The prior "how bold does `signal` get" framing presumed an accent that was never chosen — retired for this screen. Revisit accent **per-screen, never assume**.

### Layout — D1 "contained editorial" + air (LOCKED)

**Column:** `max-w-2xl mx-auto px-4 py-6` (was `max-w-3xl` at floor). The empty desktop margin is **intentional reader's-measure calm**, not dead space — a two-column "use the width" variant (D2) was tried and rejected for pulling the screen toward dashboard. This is an article, not a record.

**Decoded hero — the rebalance (resolves the floor's old Ceiling-input #1).** The card now clearly leads, via neutrals alone:

- Card surface gets **air**: `bg-paper-dark shadow-md rounded-xl px-12 py-14` (was `px-8 py-9`).
- Body bumped to `text-h3 text-ink-85 leading-loose max-w-[65ch] mx-auto` (was `text-body`) — the translation is now the largest reading element.
- Official title **quieted to a reference caption**: `font-serif italic text-h3 text-ink-50 leading-relaxed` (was `text-[22px] font-medium text-ink-70 tracking-[0.02em]`). Shown in **FULL, no clamp** — a one-line-clamp variant (D3) was rejected: the official title is the legal object, never hidden behind a "Full text" link. Resolves slot 2's arbitrary values → on-token.

### Disclaimer — designed in (LOCKED)

Filled-summary state only, inside the card beneath the body: `text-small italic text-ink-50 max-w-[65ch] mx-auto mt-5`. **Copy:** "AI-generated summary — may be incomplete or inaccurate. Not an official source." Honest about both truncation (incomplete) and generation (inaccurate); deliberately does NOT promise verification against the official text. Resolves `docs/deferred.md#ai-disclaimer-decoded-hero` (was a pre-launch BLOCK).

### Hero label — serif masthead (LOCKED — creative-director Break 1)

The Decoded card's label is a serif display word, not a meta-kicker: `font-serif text-h2 text-ink` (centered), replacing `text-meta uppercase tracking-widest text-ink-70`. Hairline beneath unchanged (`mx-auto mt-3 h-px w-8 bg-divider-strong`). **Why:** the one motivated rule-break from the creative-director ceiling pass. Instrument Serif (the system's signature face) was benched on the quiet title caption; at display scale on the hero's own name it gives the screen an editorial *voice* instead of a whisper — the single bold move in an otherwise restrained composition (the canon meta-rule). It breaks the type-scale + de-emphasize-secondary rules on purpose, and escapes "looks accidental" because it is the only scale-break on the screen and it sits on the hero. **Break 2 (left-anchoring the label) was rejected** — the asymmetry didn't earn its place; centered symmetry holds.

---

## Screen: Bill feed card (`components/BillCard.tsx`, `/bills`) — V4 "title-led + Decoded container" — LOCKED + BUILT (2026-06-06)

**Status.** **Built and shipped to `/bills`** via the `variant="v4"` prop on `BillCard` (`/dashboard` stays on the classic card; `compact` retained as the seam for a future compact variant). This section is the **complete rebuild spec** — `BillCard` must be reproducible from the text below alone. Impeccable floor passed: deterministic detector 0/25, Nielsen heuristics 32/40, audit 16/20. **Hard dependency before any build:** `docs/deferred.md#feed-card-v4-build` (needs a generated-headline column + a ~480-bill Anthropic backfill).

**Concept.** The official bill title *leads positionally* but stays a **quiet reference** (the legal object); the AI **plain-language translation is the visual anchor**, in a subtle "Decoded" container below it. Feed-card expression of the locked `/bills/[id]` rule "lead with the translation, the title is reference." Neutrals only, on-token. Vertical order top→bottom: **title → Decoded container → pills → actions.** Padding unified to **20px (`p-5`)** on both the card and the container.

### 1 — Card shell
`bg-card rounded-xl border border-divider p-5 transition-[border-color,box-shadow] duration-component ease-standard hover:border-divider-strong hover:shadow-md focus-visible:shadow-focus focus-visible:outline-none motion-reduce:transition-none`. The whole card is the `<Link>` to `/bills/[id]`. `rounded-xl` (token), **not** the stock `rounded-2xl` the pre-V4 card used.

### 2 — Title + floated citation (title wraps around the number)
- Title `<p>`: `font-serif italic text-small text-ink-50 leading-snug overflow-hidden max-h-title` (2-line cap; `max-h-title` token = `2.75em`).
- Citation (first child of the title `<p>`, floated): `float-right not-italic font-mono text-meta text-ink-50 whitespace-nowrap ml-1.5`; content `formatBillIdentifier(full_identifier)` → e.g. "S.J.Res. 99".
- Behavior: the number floats top-right; the title's line 1 sits beside it (top-aligned), line 2 wraps **underneath** it.
- **Locked cross-browser tradeoff:** clamp via `max-height` + `overflow-hidden` (normal block), **never `-webkit-line-clamp`** — the `-webkit-box` it creates kills the float in WebKit/Safari (citation drops to the left). Consequence: **no multi-line ellipsis** (title hard-cuts at 2 lines). Intentional; do not "fix" it back to line-clamp.

### 3 — Decoded container (always renders; degrades)
`mt-3 border border-divider rounded-lg p-5 bg-paper-mid` (`bg-paper-mid` token = `#FAF8F5`, near-white, ~40% from page-bg `#F7F4EE` toward white — deliberately faint). Contents in order — a label, then exactly one of three states:
- Label: `font-serif text-small text-ink-70 mb-1.5` → "Decoded".
- **Filled** (headline present): headline `text-body font-medium text-ink leading-snug line-clamp-2`, then summary `text-small text-ink-70 leading-snug line-clamp-2 mt-1`.
- **Degrade #1** (no headline, summary present): summary promoted to lead `text-body text-ink leading-snug line-clamp-3`.
- **Pending** (neither): `text-small text-ink-70 italic leading-relaxed`, copy "We're still decoding this bill into plain language. A clear read is on the way."
- **Why so light:** the headline's ink contrast carries the hierarchy, not the panel — the container is a subtle grouping, not a loud card. The near-white is Colby's deliberate end-point (paper-dark → progressively lighter → `#FAF8F5`).

### 4 — Headline (generated content; format LOCKED)
A short editorial headline generated **from the bill's `ai_summary`** (not full text): **`Topic Label — Action`**, **Title Case**, **never leads with the word "Congress"** (redundant — every bill is congressional), strictly **non-partisan**, **≤90 chars**, and must **name the specific agency/rule** so near-identical CRA "disapproval" resolutions get distinct headlines. (Mockup proof: `claude-sonnet-4-6` on 14 samples — 0 over 90 chars, 0 led with "Congress".)

### 5 — Pills (below the container)
Row `mt-3 flex items-center gap-2 flex-wrap`.
- Vote pill (always): `inline-flex items-center px-2.5 py-0.5 rounded-pill border border-divider text-ink-70 text-meta uppercase`; content `urgencyLabel().label`. Ring-outline, neutral — `urgencyLabel().color` is **deliberately not consumed** (off-palette).
- Interest pill (**match-only**, label-only): `inline-block max-w-category truncate align-middle px-2.5 py-0.5 rounded-pill bg-ink-10 text-ink-70 text-meta` (`max-w-category` token = `9rem`); content the matched category label. `ink-10` fill distinguishes it from the outline vote pill; **truncates** long labels.

### 6 — Actions (below the pills)
Row `mt-3 flex items-center justify-between`.
- Status: `text-meta text-ink-50 capitalize`; content `deriveDisplayStatus(...).replace('_',' ')`.
- CTA: `inline-flex items-center gap-1 text-small font-medium text-ink` + lucide `ArrowRight h-4 w-4`; copy "Take action".

### Build notes — dependency, debt, parked (full tracking: `docs/deferred.md#feed-card-v4-build`)
- **Hard dependency (blocks build):** the headline needs a new `bills` column + a ~480-bill Anthropic backfill (spend gate). The card is **inert without it** — it falls to summary-led, the degraded state, not the design.
- **Tokenized in build 1:** `#FAF8F5` → `paper.mid` (`bg-paper-mid`); `max-w-[9rem]` → `maxWidth.category` (`max-w-category` = 9rem, kept with `truncate` + the real label); `maxHeight: '2.75em'` → `maxHeight.title` (`max-h-title`).
- **a11y debt (v2-deferred per `PRODUCT.md`, logged):** `ink-50` title ~3.6:1 (under AA 4.5:1); `#FAF8F5` container border ~1.2:1; the `<Link>` needs an `aria-label` (the headline) + `aria-hidden` on the arrow; `break-words` insurance on title/headline/summary.
- **Parked:** the vote pill ("VOTE IMMINENT") + status ("Floor Vote") both signal the vote (redundancy — Colby's later call); the CRA category-wall is **rescued by the distinct headline, not eliminated** (true fix = a parked feed-ordering/ranking decision — see `#feed-card-cra-wall`); the **favicon glyph is a separate open brand call (O vs Or)** owned by the logo work, recorded here only so it isn't lost.

---

## Screen: Landing (`app/page.tsx`, `/`) — donor-ready redesign — LOCKED (2026-06-07)

Branch `feat/donor-ready-landing`. Floor (Impeccable critique: deterministic detector **0 findings**, Nielsen **30/40**) + brand + ceiling co-design at 390 + desktop (WebKit). **Brand register** — design IS the product. Public marketing page; a logged-in visitor is redirected to `/dashboard` (the server component reads the session, redirect outside the try/catch since it throws). The `noindex` launch-gate block in `app/layout.tsx` stays.

### Composition / rhythm — LOCKED

- **Alignment system (intentional, not incidental):** **centered = the emotional bookends** (hero, closing CTA); **left-aligned = the informational middle** (`How it works`, `What Oravan does`). The page reads center → left → left → center. This is the antidote to the centered-everything SaaS template the floor critique flagged — one deliberate left spine through the explain-the-product zone.
- **Section rhythm tightened off the airy default** (the doubled `py-20` produced ~160px seams that read as dead space): hero `pt-16 pb-10`, content sections `py-10`, the warm features band `py-12`, footer `py-8`. Seams now ~80px — generous but intentional.

### Nav + wordmark — LOCKED

- Nav: `OravanWordmark` `h-9 text-ink` (left) + "Sign in" ghost button + "Get started" primary (right).
- **Wordmark sizing hierarchy:** nav `h-9` (36px, the primary brand moment) **>** footer `h-7` (28px, the quiet sign-off). Deliberate hierarchy, not two identical logos. Source component: `components/brand/OravanWordmark.tsx` (currentColor serif SVG, themes via `text-*`).

### Hero — LOCKED

- Eyebrow: `text-meta uppercase text-ink-50 mb-6` — "Pro-democracy · Non-partisan". A quiet meta-caps line, **not** a bordered icon pill (the pill read as SaaS-template).
- Headline: `font-serif text-h1 sm:text-display text-ink leading-tight mb-6 text-balance` — "Your voice matters. / Make it heard." Instrument Serif is the page's one serif-voice moment.
- Subhead bakes the **AI-review safeguard in at first mention** (brand principle "honest about AI" — the reassurance travels *with* the claim, not three sections later): "...AI-drafted scripts **you always review first**, one-tap calling, and legislation matched to your values."
- **Single** primary CTA `<Button size="lg" className="w-full sm:w-auto">Start making calls</Button>` + a quiet secondary text link (not a co-equal button): `Already have an account? Sign in` (`text-small text-ink-50 underline underline-offset-2 hover:text-ink`). The old two co-equal full-width buttons competed on mobile.
- Microcopy: `mt-5 text-small text-ink-50` — "Free. No ads, no data selling, no tracking."

### How it works — numbered editorial sequence — LOCKED

Replaced the centered 3-up icon-circle grid (the critique's template seam) with a **vertical numbered ruled list** in a reader column (`max-w-3xl`). Vertical reads as a true 1→2→3 sequence (parallel columns read as options); the serif numerals are the device (brand voice), not generic filled circles; hairline rules tie it to the editorial system without duplicating the wide capability grid.

- `<ol className="border-t border-divider">`; each `<li className="flex items-start gap-6 sm:gap-8 border-b border-divider py-6">`.
- Numeral: `font-serif text-display text-ink-20 leading-none w-12 shrink-0` (large, faint — an elegant anchor, **not** a loud number).
- Body: title `text-h3 font-semibold text-ink mb-1.5`; description `text-ink-70 text-small leading-relaxed`, in a `pt-1.5` block.
- Step 2 carries the **Congress.gov provenance** ("...drawn directly from Congress.gov") — the one load-bearing fact rescued when the standalone trust strip was cut.

### What Oravan does — card-less editorial list — LOCKED

Replaced the 5 identical icon + heading + text shadow cards (the **identical-card-grid** ban + "cards are the lazy answer" + decorative hover-lift on non-clickable cards) with a **card-less hairline-ruled list** on the warm band.

- Section: `bg-paper-dark border-y border-divider`; heading **left-aligned** `font-serif text-h2 text-ink mb-12` "What Oravan does" (was the SaaS trope "Everything you need to be civically active").
- Grid: `grid sm:grid-cols-2 gap-x-12 gap-y-9` in `max-w-5xl`. Each item `border-t border-divider pt-5`, a row `flex items-center gap-2.5 mb-2` = quiet lucide lead icon `w-4 h-4 text-ink-50` + title `text-body font-semibold text-ink` (+ optional right tag `ml-auto text-meta uppercase text-ink-50`), then `text-small text-ink-70 leading-relaxed`.
- **6 items** (squares the grid to a clean 3×2): Issues · Representatives · AI script · Track impact · Independent (funded by people) · **State & local coverage** tagged **"On the roadmap"**. The roadmap item is the single forward-looking entry, explicitly labeled future — never presented as a current capability (state/local is out of MVP scope; the tag is the honesty guardrail). The Privacy card was reframed off its verbatim hero-fine-print repeat to "Independent, funded by people."

### Closing CTA — LOCKED

- Headline `font-serif text-h1 text-ink mb-4 text-balance` — "Anyone in the US can do this." (was "Ready to make your voice heard?", a near-verbatim hero restatement — copy law: no restated headings).
- Promotes the formerly-buried 12px inclusivity line to the **payoff**: "You don't have to be a citizen to contact your representatives. Five minutes, and it's free for everyone."
- `<Button size="lg">Start making calls</Button>`. **CTA label unified** across the page: nav "Get started" / hero "Start making calls" / closing "Start making calls" (was three different verbs for one `/signup` destination); "free" lives in microcopy, not baked into every label.

### Footer — LOCKED

`OravanWordmark h-7 text-ink` + `text-meta uppercase text-ink-50` "Nonpartisan, by design" + real Privacy / Terms / Contact links (`mailto:hello@oravan.org` — **the address must exist before launch**).

### Accent / color — NONE (parked, not locked)

The landing ships **monochrome** (ink-green on paper, neutrals only). An accent hunt was run and **all candidates rejected**: `signal` orange (off/warm-red), antique gold `#A67C2E` (afterthought — harmonious/low-contrast with the teal-green at hue ~164deg), and the true complement berry `#A33A5B` (~341deg, impactful but jarring/pink for a calm civic tool). The palette has **no obvious accent home**; monochrome is on-brand and cleared the slop bar. **Accent parked post-launch** — full record in `docs/deferred.md#brand-accent-color-pops`. Mirrors the bill-detail ceiling's "no accent" outcome: **accent is decided per-screen, never assumed.**

---

## Screen: App routes (dashboard · onboarding · representatives · impact · settings · auth · legal) — UI cohesion pass — LOCKED (2026-06-07)

Branch `feat/app-ui-cohesion`. Completes the long-deferred consolidation sweep (`components/ui/README.md` "Chunk 3"; `docs/deferred.md#consolidation-followup-offscope-slate-and-semantic-colors`): bring every non-landing route onto the system the landing + `/bills/[id]` already lock. **Product register** — these serve the product, so they inherit the brand's serif voice for titles but stay restrained, neutral, on-token. Functional gate green (lint + build + vitest 21/21 + Playwright 10/10); Impeccable `detect` **0 findings** on code + renders; WebKit visual review at 390 + desktop. **Source of truth:** the landing (`app/page.tsx`) + this doc's bill-detail / feed-card sections. The landing itself is untouched.

### Heading typography — LOCKED

The app previously set page titles in sans `font-bold`, which on `<h1>`/`<h2>` elements forced a synthetic faux-bold over the serif base rule (`globals.css` makes h1/h2 Instrument Serif). Rationalized to the landing's actual pattern (h1/h2 serif, h3 sans-600):

- **Page title (`<h1>`)** → `font-serif text-h2 text-ink`, via the `PageHeader` primitive (24px Instrument Serif).
- **Section heading (`<h2>`)** → `font-serif text-h3 text-ink` (18px serif; `font-bold` dropped). E.g. dashboard "For You"/"Trending Issues", impact "Call history", settings "Profile"/"My Issues".
- **Item title (`<h3>`)** → `text-h3 font-semibold` (sans-600, h3 base). Unchanged.
- **Stat-widget / kicker labels** → `text-meta uppercase text-ink-50` (ImpactMetrics "YOUR IMPACT", settings "ADMIN", auth "OR CONTINUE WITH").

### Shared primitives — LOCKED (`components/ui/`)

- **`PageHeader`** (`page-header.tsx`) — title (+ optional description/action). Centralizes the serif page-title rule. On dashboard/bills/impact/settings/representatives.
- **`EmptyState`** (`empty-state.tsx`) — centered lucide icon (`h-8 w-8 text-ink-50`) + title (`font-semibold text-ink`) + description (`text-small text-ink-70 max-w-xs`). Replaces 4 hand-rolled zero-data states. Wrapped in `<Card padding="lg">` for a surface; bare for the representatives prompt.
- **`Alert`** (`alert.tsx`) — `error` (`bg-oxblood-10 border-oxblood/20 text-oxblood`) / `success` (`bg-moss-10 border-moss/20 text-moss`), base `rounded-xl border p-3 text-small`, `role` per variant. Replaces 7 copies of the off-palette `bg-red-50 border-red-200 text-red-700` banner (auth/onboarding/settings/representatives) + login's green success.

### Card radius — LOCKED (reconciled to token)

`Card` and the raw page cards (incl. `BillCard` classic) moved `rounded-2xl` (16px, off-scale) → `rounded-xl` (20px token), unifying every surface with the locked components (BillCard V4, ScriptFlow, CallFlow, Decoded hero). Resolves the `components/ui/README.md` radius-off-token note.

### Brand wordmark in-app — LOCKED

The locked `OravanWordmark` (currentColor SVG, `aria-label="Oravan"`) replaces every ad-hoc text "Oravan":

- Sidebar (`NavBar`): `h-7 text-ink` + `text-meta uppercase text-ink-50` "Nonpartisan, by design" (was `text-xl font-bold` "Oravan" + off-brand "Not political. Just powerful."). Mobile bottom-nav labels `text-xs` → `text-meta`.
- Auth (login/signup/forgot/reset): `h-8 text-ink`, centered (per-page taglines dropped). Onboarding `h-7 mx-auto`. Legal nav `h-7`.

### Party badge — LOCKED (neutral, on-token)

Rep party renders as the neutral outline pill used by the bill status pills: `inline-flex items-center px-2.5 py-0.5 rounded-pill border border-divider text-ink-70 text-meta uppercase` (RepCard + CallFlow). The partisan blue/red/purple `partyColor()` helper is **deleted** (`lib/utils.ts`) — party color is not rendered on a deliberately nonpartisan tool. (`urgencyLabel().color` remains unused/off-palette, untouched — its own debt line.)

### RepCard — LOCKED (full retoken)

Was fully pre-system (`bg-white`, `slate-*`, raw sizes, emoji 📞🌐, and a **broken `bg-action-500`** — undefined token, so the Call button rendered with no fill). Now: `bg-card rounded-xl border border-divider`; avatar `bg-ink-10 text-ink-50`; name/title on the type scale (matching CallFlow's rep rows); Call button `bg-signal text-white` + lucide `Phone` (matches CallFlow's tap-to-call + the Button `signal` variant); website button lucide `Globe` with `aria-label`.

### Type-scale sweep — LOCKED (snap-to-token)

All raw `text-xs` (12px non-uppercase, off the project scale) on the touched surfaces resolved per the tokens-only rule: descriptive sublines → `text-small` (14px); short labels/kickers → `text-meta` (12px uppercase). No new caption token added — the `type-scale-extension` token *gap* stays open for future surfaces, but the app/auth/legal routes now carry no raw `text-xs`. Em dashes in touched UI copy replaced (commas/periods) per the no-em-dash copy law (privacy/terms legal-prose em dashes left as intentional).

### Out of scope (not regressed, deferred)

- `/bills/[id]`, `BillCard` V4, `ScriptFlow`: already floor+ceiling locked; cohered-by-inheritance only (classic-card radius reconciled; no internal rework).
- `Badge` primitive: still deferred (would touch locked card pills; needs the 12px-caption token decision).
- Privacy/terms legal-prose em dashes; `urgencyLabel().color` dead tints; a11y contrast deferrals (per `PRODUCT.md`, v2).
- The `creative-director` ceiling pass was not run (product-register utility screens). (The LLM `/critique` *was* run after this — see below.)

### Post-critique adjustments — LOCKED (2026-06-07)

Ran Impeccable `/critique` (two isolated assessments: LLM design review + deterministic `detect`) on the full pass **and** a "match the bills pages to the app" mockup. Detector: **0 findings** throughout; design health **29/40** both. The headline — reached **independently** by the cohesion review and the bills-mockup review — was: **unify the bill card on the decode-led V4, and protect the editorial hero.** "Cohere the chrome, not the hero." Resulting changes:

- **Dashboard now leads with the V4 card** (`variant="v4"`), not the classic title-led card. Resolves the critique's only P0: the post-login home was an "identical card grid" of opaque official titles (failing both the *identical-card-grid* ban and *Decode-don't-display*). One decode-led card now renders on `/dashboard` **and** `/bills`. **This supersedes the earlier "/dashboard stays on the classic card" note** in the V4 feed-card section.
- **A "match the app" mockup was tested and rejected** for the two moves that flatten these screens: switching the feed to the classic card (rejected — inverts Decode-don't-display on the highest-traffic screen) and the bill-detail Decoded hero to a white card (rejected — erases the locked "warm counterweight" and caused a load-time skeleton-mismatch pop). Both reverted; the warm `bg-paper-dark shadow-md px-12 py-14` hero stays locked.
- **Kept from the mockup** (mechanical wins): bill-detail back control is lucide `ArrowLeft` (was a raw `←` glyph); the AI disclaimer + feed retry copy are now on the no-em-dash law.
- **Greeting** drops the `email.split('@')[0]` fallback — plain "Welcome back" when there's no `full_name` (no raw identifier in the brand's warmest moment).
- **Legal pages** (`/privacy`, `/terms`) route through `PageHeader` (`text-h2`), resolving the one cross-screen title-size break (they were `text-h1`); the subline em dash went with it.
- **Onboarding** card wordmark is `lg:hidden` — the app sidebar already carries it on desktop, so the first-run screen no longer renders two wordmarks (mobile keeps the one).

Still open (critique, deferred): dashboard still loads 10 V4 cards (a teaser cap to 3–4 was suggested, not done); bare-text loading states vs the bill-detail skeleton; the always-identical "Federal" feed pill; the sidebar "Signed in as" still shows the email local-part for name-less accounts; `creative-director` ceiling not run.

---

## System: Spine ceiling — top masthead + warm surface ladder + decode-is-the-card — LOCKED (2026-06-08)

Reconciled from a 4-direction parallel exploration (restraint / warmth / open×2), then refined per-decision in a live page-switcher. Shipped as **PR #55** (shell + primitives) and **PR #56** (bill card + warm rep/impact). **Supersedes** the left-sidebar app shell and the nested-container V4 card recorded above.

### App shell — top masthead — LOCKED (replaces the left sidebar)

`components/NavBar.tsx`. The desktop left rail is **removed** (`(app)/layout.tsx` drops `lg:ml-64`); the shell is a distinct **ink-green band over the warm body** — the GOV.UK civic-header move, not a seamless strip.

- **Bar:** `hidden lg:flex items-stretch h-16 px-8 bg-ink sticky top-0 z-40` — its own `bg-ink` surface, **no shadow**; the colour is the chrome/content separation.
- **Wordmark + nameplate rule:** `<OravanWordmark className="h-7 text-paper" />` then `<span className="mx-6 h-6 w-px bg-paper/20" aria-hidden />` (newspaper-nameplate divider).
- **Nav — text-only, no icons:** `nav` is `flex items-stretch gap-7`; each link `relative flex items-center text-small font-medium transition-colors duration-micro`, active `text-paper`, idle `text-paper/60 hover:text-paper`.
- **Active = signal underline on the masthead baseline** (the one accent, used as wayfinding): active link renders `<span className="absolute inset-x-0 -bottom-px h-0.5 rounded-pill bg-signal" aria-hidden />` + `aria-current="page"`.
- **Account meta in mono:** `<span className="text-mono text-ink-50">{userName}</span>`, then a `bg-paper/20` divider + Settings (`text-small text-ink-70 hover:text-ink`, lucide gear).
- **Mobile** keeps the original bottom-tab nav (its own decision; unchanged). Verified WebKit + Chromium; happy-path is `tests/masthead.spec.ts`.

### Warm surface tonal ladder — LOCKED

White is **demoted to a single accent** (the decoded "answer" panel); every default surface is warm. The ladder by role:

**`ink` masthead → `paper` page (`#F7F4EE`) → `paper-mid` card (`#FAF8F5`) → white `card` (`#FFFFFF`) only as the inner "answer".**

- **`Card` primitive** (`components/ui/card.tsx`): `bg-card` → **`bg-paper-mid`**, hairline `border border-divider`, **no shadow** (shadow is the slop tell; warmth + hairline separate). `rounded-xl` (20px surface radius).
- **`Input`** (`components/ui/input.tsx`): `bg-card` → **`bg-paper-mid`**; `rounded-xl` → **`rounded-md` (8px control radius)** — the corner now encodes affordance (controls crisp at 8, surfaces soft at 20; buttons already 8). `duration-[120ms]` → `duration-micro`.
- **`EmptyState`** (`components/ui/empty-state.tsx`): title → `font-serif text-h3 text-ink` (brand voice at the rare empty moment); icon **seated in a warm medallion** `flex h-14 w-14 items-center justify-center rounded-pill bg-paper-dark` with `Icon h-6 w-6 text-ink-70 strokeWidth={1.75}` (retires the floating-icon slop).
- **`RepCard` / `ImpactMetrics`:** `bg-card` → **`bg-paper-mid`** (hover-shadow dropped) so the last white components match the primitive — the app is one temperature.

### Bill feed card — "decode is the card" — LOCKED (supersedes the nested V4 container)

`components/BillCard.tsx` `BillCardV4`. An Impeccable `/critique` named the real defect in the warm-outer + white-inner version: **a nested card** (Impeccable: "nested cards are always wrong"). Chosen from a live A/B/C compare. The fix dissolves the outer container:

- **Outer is the bare `<Link>`** (no surface): `block group rounded-xl focus-visible:shadow-focus focus-visible:outline-none`.
- **Official title floats on the paper as a quiet source line:** `px-1 mb-2.5 font-serif italic text-small text-ink-70 leading-snug overflow-hidden max-h-title break-words` (citation floated, `not-italic font-mono text-meta text-ink-70`). Still the `max-h-title` clamp, **never `-webkit-line-clamp`** (breaks the float in WebKit).
- **The single card IS the decoded answer + meta + action** (one surface, no nesting): `bg-card rounded-xl border border-divider p-5 transition-[border-color] duration-component ease-standard group-hover:border-divider-strong motion-reduce:transition-none`. Inside: `Decoded` kicker (`font-serif text-small text-ink-70 mb-1`); **headline promoted to the hero** `text-h3 font-medium text-ink leading-snug break-words` (was `text-body`); summary `text-small text-ink-70 line-clamp-2`; pills (`mt-4`); then a hairline-divided **action row** `mt-4 pt-4 border-t border-divider flex items-center justify-between` (status `text-meta text-ink-70` + "Take action" `ArrowRight`).
- **Contrast fix:** quiet text `ink-50` → **`ink-70`** (title, citation, status) clears the detector's AA 3.4:1 flag on the warm surface. The classic `BillCard` path is unused (dashboard + bills both render v4) and left untouched.

### Supersessions + context
- The **left-sidebar app shell** → replaced by the top masthead; the "sidebar Signed-in-as local-part" open item is now moot (no sidebar).
- The **nested V4 Decoded container** (warm card holding a white box) → replaced by decode-is-the-card.
- Impeccable `PRODUCT.md` restored (brand stable) + `DESIGN.md` regenerated from this state, both gitignored working context. `creative-director` ceiling still not run.

---

## System: Landing + auth cohesion — bridge header, warm hero band, flat auth cards — LOCKED (2026-06-08, PR #57)

The donor-ready landing (above) shipped **before** the spine ceiling, so its header + surfaces had drifted off the app's newer warm system. An isolated Impeccable `/critique` (design health 29/40, **Consistency** the weak axis) named two **P1** seams: the landing's light/seamless header vs the app's ink masthead (a visible jump at login), and the `(auth)` cards still on a pre-cohesion surface. Direction chosen from a live 3-way render (full ink band / authored bridge / plain) + a top-warmth A/B. **Supersedes** the donor-ready "Nav + wordmark", "Hero" (surface), and "Accent — NONE (parked)" entries above.

### Landing nav — "bridge" — LOCKED (supersedes donor-ready "Nav + wordmark")

Keep the light brand header — do **not** flatten it into the app's full ink band (rendered, the band read too heavy as a first impression and spent the landing's warmth on chrome). Bridge it instead: a defined edge + the app's accent introduced once.

- `<nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto border-b border-divider">` — adds `border-b border-divider` (a hairline edge foreshadowing the masthead's separation) to the donor-ready nav.
- `OravanWordmark h-9 text-ink` (unchanged); "Sign in" `<Button variant="ghost" size="sm">`.
- **"Get started" → `<Button variant="signal" size="sm">`** (was the default ink button) — the one accent.

### Landing hero — warm `paper-dark` band — LOCKED (updates donor-ready "Hero")

The hero **content** is unchanged (eyebrow / serif headline / safeguard subhead / single CTA — see the donor-ready Hero entry). Only the surface changes: the hero `<section>` is wrapped in a full-width warm band.

- `<div className="bg-paper-dark border-b border-divider">` wrapping `<section className="px-6 pt-16 pb-10 text-center max-w-4xl mx-auto">…</section>`.
- **Why the warm hero band (option 1) over a whole-top warm zone (option 2):** reserved warmth reads as a deliberate "welcome" and keeps the light header as crisp chrome; warming the header too made the warmth a default wash and erased the bridge's hairline edge (tan-on-tan). `paper-dark` is the system's **warm-emphasis** tone, used here as emphasis (not a new default surface) — on the tonal ladder. Sets a warm → paper → warm page rhythm (hero band → "How it works" paper → "What Oravan does" band).

### Landing accent — signal introduced once — LOCKED (supersedes "Accent — NONE (parked)")

The donor-ready landing parked accent and shipped monochrome ("no obvious accent home") — decided **before** the app locked `signal` as its wayfinding accent (the masthead active-underline). Re-decided per-screen in that light: **signal-orange now appears exactly once on the landing — the "Get started" nav CTA.** Its job is cohesion, not decoration — the accent the visitor meets at the top is the same one the app uses for wayfinding, so the masthead reads as *inherited* at login. Still one-accent-per-screen; no other color. (`docs/deferred.md#brand-accent-color-pops` accent-hunt record is now moot for the landing.)

### Auth cards — warm flat surface — LOCKED (extends the spine-ceiling surface law into `(auth)`)

`app/(auth)/{signup,login,forgot-password,reset-password}/page.tsx`. The auth card was still `<Card … className="shadow-sm">` with a white `bg-card` divider mask — a resting shadow + a white surface, both against the spine-ceiling tonal-ladder law, on the *seam* screen a visitor hits right after the landing.

- **Card:** `<Card padding="lg">` — `shadow-sm` dropped; the card is now the warm flat `paper-mid` primitive (no resting shadow; warmth + hairline separate).
- **Divider mask:** `<span className="bg-paper-mid px-3">or sign up with / or continue with</span>` (was `bg-card` white) — the "or …" label masks the rule in the card's actual surface colour, not a brighter white patch.

### Supersessions + context
- Donor-ready **"Nav + wordmark"** → bridge nav (hairline edge + signal CTA); **"Hero"** surface → warm band; **"Accent — NONE (parked)"** → signal introduced once.
- Extends the spine-ceiling **warm surface ladder** into the `(auth)` group — the one place the cohesion sweep hadn't reached.
- Gate: lint + build + Playwright **11/11**; landing + signup verified in WebKit (390 + desktop). `creative-director` ceiling still owed; **button token hygiene** (`cn`/twMerge blank-label fix + the `12/13/14` → control-token scale) is the next focused step.

---

## System: Button control-token + cn font-size resolution — LOCKED (2026-06-08)

Closes the last live arbitrary-type debt (`docs/deferred.md#type-scale-extension`): `components/ui/button.tsx` sized control labels with brackets (`text-[13px]` base / `text-[12px]` sm / `text-[14px]` lg + `duration-[120ms]`), because 13px-sans had no token and `meta`/`small` carry the wrong case/tracking for a button label.

### `control` font-size token — LOCKED

- `tailwind.config.ts` → `fontSize.control: ['13px', { lineHeight: '1' }]` — the control-label size (no tracking), the type parallel to the **8px control radius**. (Distinct from `mono` 13px, which is the monospace face.)
- `button.tsx`: base + sm → **`text-control`** (13px); **lg → `text-small`** (14px — the hero/form CTA size, unchanged); `duration-[120ms]` → **`duration-micro`**. **sm text went 12 → 13px** — negligible, and chosen over adding a second `control-sm` token (button-size differentiation is carried by height/padding, not a 1px text step). Two values stay arbitrary by intent (out of this type-debt scope): **`px-[18px]`** (the control's horizontal padding — documented in `DESIGN.md`; no standard 18px spacing token, so a sanctioned one-off like `max-w-[65ch]`) and **`active:scale-[0.98]`** (a deliberate micro-press).

### `cn()` resolves custom font-size tokens — LOCKED (`lib/utils.ts`)

`cn` now uses `extendTailwindMerge` to register the project's custom fontSize names (`display/h1/h2/h3/body/small/meta/mono/control`) as the **font-size** class group. tailwind-merge ships only the default scale, so left alone it does **not** dedupe two custom `text-*` tokens — a size override (the button's `lg` over its base) would silently emit **both** classes and let the cascade decide. This registration was the prerequisite for the token-based button sizes to override correctly, and it defuses the latent "custom size token mis-read as a color → dropped label colour" edge. Guarded by `lib/__tests__/utils.test.ts` (override resolves to last; a text color survives alongside a size token; standard merges intact). Gate: lint + build + **vitest 24/24** + Playwright 11/11.

---

## Screen: Issue picker (onboarding + settings) — "pick a few to start" + shared component — LOCKED (2026-06-08)

The 12-issue picker was the cognitive-load flag in the whole-UI `/critique` (a wall of 12 flat options) **and** a cohesion break — it rendered as **numbered checkbox rows** in onboarding but **filled pills** in settings (same control, two looks). Resolved by splitting the *job* and unifying the *component*.

**The job (decided B over A):** onboarding is a **low-pressure starting pick** ("Pick a few that matter to you. You can change these anytime."); settings is the **manage** view. The wall stops being a wall because you grab what jumps out, not weigh all 12 — honoring the brand's "calm, five-minutes" posture. (A — keep select-all but group into themed bands — was rendered and **rejected**: the CRS categories don't cluster cleanly, so the bands felt arbitrary.)

**The treatment (V3, chosen from a 3-way render — flat / grouped / flat-with-examples):** a flat 2-column **card grid** where each card shows the category label **plus its plain-language `subline`** ("Government & Democracy → voting rights, campaign finance reform"). The examples *decode the category* — the brand thesis applied to the picker, and the real fix for a low-literacy first-timer (comprehension, not grouping). The `subline` data already existed in `lib/interests.ts` (written "for pull during onboarding"), unused until now.

### Shared `IssuePicker` component — LOCKED (`components/IssuePicker.tsx`)

One controlled component for both surfaces (kills the two-looks inconsistency by construction; parent owns the `selected` Set + persistence).
- Grid: `grid gap-2.5 sm:grid-cols-2`.
- Card: `rounded-lg border px-4 py-3 text-left transition-colors duration-micro focus-visible:shadow-focus focus-visible:outline-none`; selected `border-ink bg-ink`, idle `border-divider bg-paper-mid hover:border-divider-strong` (warm surface + hairline, **no shadow**).
- Label: `block text-small font-medium` (`text-paper` selected / `text-ink` idle).
- Subline: `mt-0.5 block text-caption` (`text-paper/70` selected / `text-ink-50` idle).
- Onboarding's categories `<Card padding="md">` also dropped its `shadow-sm` (the same surface-law fix as the `(auth)` cards — onboarding is `(app)`, so #57 hadn't reached it).

### `caption` font-size token — LOCKED (closes the type-scale gap)

The subline needed a **12px non-uppercase caption** — the long-deferred `type-scale-extension` gap (the same token that blocked `Badge`). Added `fontSize.caption: ['12px', { lineHeight: '1.4' }]` (distinct from `meta`, which is 12px UPPERCASE + tracked) and registered it in `cn()`'s tailwind-merge font-size group. The picker was the genuine trigger; **the `type-scale-extension` thread is now closed** (`Badge` unblocked, though not yet built). Gate: lint + build + vitest 24/24 + Playwright 11/11.

---

## Screen: Dashboard (`/dashboard`) — collapsed to the decode-led feed — LOCKED (2026-06-08)

The whole-UI `/critique` named the dashboard the platform's one **slop-island**: a zero-stat metric pair (`ImpactMetrics`) stacked over a 2-up **icon + heading + text quick-action card grid** ("Browse Issues" / "My Representatives") with `hover:shadow-sm` — the banned generic-SaaS-dashboard / identical-card-grid plus a flat-by-default violation, on the highest-traffic screen, contradicting the product's own "decode, don't display" thesis (it led with chrome, not a decoded bill). Chosen fix (the boldest of three): **collapse the dashboard into the feed.**

- **Removed:** the `ImpactMetrics` widget (and its `call_events` data fetch — the counts live on `/impact`), and **both quick-action cards** (they duplicate masthead nav items — you were paying twice for the same destinations).
- **Kept, as the home:** the `PageHeader` greeting ("Welcome back[, name]") + the **decode-led V4 feed** ("For You" personalized / "Trending Issues" default, "See all →" → `/bills`). The feed *is* the dashboard now — greeting + feed, nothing between.
- **Warmed the onboarding nudge onto the ladder:** the "Personalize your feed" banner (un-onboarded users) moved from the off-ladder cool `bg-ink-10 border-ink-20` to **`bg-paper-dark border-divider`** (warm emphasis, on the tonal ladder) — the one non-ladder surface the critique flagged is now on it.

Net: the post-login home leads with decoded bills, the slop-island is gone, `/dashboard` is ~48 lines lighter. Gate: lint + build + Playwright 11/11.

---

## System: Loading skeletons — shared `Skeleton` primitive — LOCKED (2026-06-08)

The `/critique` flagged inconsistent loading: `/bills/[id]` had a considered `animate-pulse` skeleton, but the feed used no fallback and reps used bare text ("Loading your reps…"), so the *quality of the wait* varied across the product (heuristics #1/#4).

- **`components/ui/skeleton.tsx`** — the `Skeleton` primitive (`animate-pulse rounded bg-ink-10`, `aria-hidden`), promoted from the bill-detail skeleton, plus two layout-shaped compositions: **`BillCardSkeleton`** (mirrors the decode-is-the-card V4 — source line on the paper → white card with the "Decoded" kicker + headline + summary + pill + hairline action row) and **`RepCardSkeleton`** (mirrors RepCard — avatar + name/title + buttons).
- **Applied:** `app/(app)/bills/loading.tsx` + `app/(app)/dashboard/loading.tsx` (Suspense fallbacks for the server-rendered feeds — static title, skeleton cards); reps' bare loading text → three `RepCardSkeleton`s; and the bill-detail skeleton refactored onto the shared `Skeleton` (one vocabulary; the container `animate-pulse` is dropped since each block self-pulses).

Every data-backed screen now holds its real shape while loading — nothing pops or shifts in. Gate: lint + build + Playwright 11/11.

---

## System: AA contrast sweep + line-length / auth-padding nits — LOCKED (2026-06-08)

The whole-UI `/critique` measured `ink-50` quiet text at **2.9–3.6:1 (below AA 4.5:1)** on the warm surfaces. Un-parking the v2 a11y deferral for the clear cases:

- **`text-ink-50` → `text-ink-70`** across ~15 files — every quiet small-text use on light surfaces (captions, sublines, microcopy, links, `meta` kickers, the mobile-nav idle labels). `ink-70` (`#556159`) clears AA while staying quiet; the change is **near-invisible to good vision in good light** — the point is the worst case (low vision, sunlight, cheap screens). The bill-detail **official title** (`text-h3`, the deliberately-demoted reference caption) goes `ink-50` → `ink-70` too: still quieter than the `ink` headline, now legible. Non-text `ink-50` and the dark-masthead paper-tone are untouched.
- **Line-length:** the landing closing-CTA paragraph capped to `max-w-2xl`; the legal pages (`/privacy`, `/terms`) tightened from `max-w-2xl` to `max-w-[65ch]` (the locked reading measure).
- **Auth padding:** the centered `(auth)` container gained a `py-12` vertical inset (was flush to the viewport on short screens — the detector's `cramped-padding`).

**Legal type-scale:** the legal pages (`/privacy`, `/terms`) — low-traffic, public, **brand register** — get a deeper title: the shared `PageHeader` (`h2`/24) → a direct serif **`h1`** (36px) + description, a clearer 36/16 jump (the detector's flat-14/16/24 flag). A conscious departure from PR #52's "legal on `PageHeader` for title cohesion" — justified because legal is brand-register *editorial* (it should read like the landing, not the app chrome), and the pages are rarely seen.

Gate: lint + build + Playwright 11/11.

---

## Screen: Landing (`/`) — broadsheet hero headline (creative-director ceiling) — LOCKED (2026-06-08)

First **ceiling** pass via the `creative-director` skill, run *after* the floor was clean (the whole-UI `/critique` cleared, the 4-item floor shipped as #59–#62). Mode 1 read the landing as disciplined and on-canon — the load-bearing rules were **restraint**, the **reserved serif** (display weight held back for moments that matter), and the **type scale** (every step a sanctioned token). Those are exactly the rules worth breaking *here*, because the landing is the one **brand-register** surface where the design IS the product.

**The break shipped (1 of 3 proposed — exaggeration):** the hero `<h1>` jumps the type scale to a **broadsheet headline** — `text-broadsheet` = `clamp(2.75rem, 8vw, 6rem)` / `lineHeight 1.03`, well past the `display` (56px) ceiling. Paired with **more air** above/below the hero (`pt-24 pb-16`, up from `pt-16 pb-10`).
- **The rule it breaks:** the type scale (every size is a token; nothing exceeds `display`). The scale exists so sizes read as *authored*, not arbitrary — an off-scale size usually looks accidental.
- **Why it escapes the failure mode:** it doesn't look accidental because (a) it's the **single** largest element on the one page that's pure brand, (b) it's a fluid `clamp()` so it's *composed* to the viewport rather than a fixed magic number, and (c) it's promoted to a **named token** (`fontSize.broadsheet`) — a sanctioned scale step, not a one-off `text-[...]`. The exaggeration becomes the point: editorial confidence, the broadsheet-front-page voice the brand wants.

**Rejected (the other two CD proposals, both rendered as mockups + re-read by the CD):**
- **Dateline rules** (flanking `h-px w-10` hairlines around the eyebrow) — too quiet; the CD's own re-read called it a whisper that didn't earn its complexity.
- **Honest waste alone** (huge empty hero, `pt-36 pb-28`, no headline change) — air without the headline is just a gap; the air only works *as support* for the bigger type, so it folded into the shipped break at a calmer `pt-24 pb-16`.

**Token added:** `fontSize.broadsheet: ['clamp(2.75rem, 8vw, 6rem)', { lineHeight: '1.03' }]` (registered in `cn()`'s tailwind-merge font-size group) — the one sanctioned scale-break, reserved for a top-of-page brand hero. Not for app/product surfaces. Gate: lint + build + Playwright 11/11.

---

## System: App nav — mobile top masthead (mirrors desktop), "Issues" dropped — LOCKED (2026-06-08)

The mobile nav was a white **bottom** tab bar (`bg-card`, icon+label, `Home · Issues · My Reps · Your Impact`) that matched nothing else in the app — and **Settings was unreachable on a phone** (it lived only in the desktop masthead's top-right, which is `hidden lg:flex`). Replaced with a **top masthead that mirrors the desktop ink band.**

- **Mirror, not a separate pattern.** The mobile nav is now a sticky **top** `<header className="bg-ink">` using the same vocabulary as the desktop masthead: `text-paper` active / `text-paper/60` idle, the `bg-signal` `-bottom-px` underline on the active section, the wordmark left, and a **Settings gear in the top-right utility slot** — the same slot as desktop. On mobile it stacks into two rows (brand row: wordmark + gear; section row: `Home · My Reps · Your Impact`) to fit the width; desktop stays one row. The contrast: one ink band across both breakpoints, not two unrelated navs.
- **"Issues" dropped on both surfaces.** Now that the dashboard *is* the feed (see the dashboard-collapse decision), Home opens the feed and "See all →" still bridges to `/bills`, so a dedicated Issues tab was redundant. `/bills` is untouched and still routable.
- **Settings = gear, not a tab.** Making Settings the top-right gear (rather than a 4th bottom tab) is what makes the two navs true mirrors — and it still fixes the "unreachable on mobile" bug. `NAV_ITEMS` is now icon-less (text labels on both surfaces); the per-item lucide icons were dropped.
- **Layout:** `app/(app)/layout.tsx` dropped the `pb-20` bottom-bar clearance — the nav is a sticky top element in normal flow, so the main column needs no padding hack.

Test: added `mobile: Settings is reachable from the mobile masthead` (390px viewport → taps the gear → asserts `/settings`). Gate: lint + build + Playwright 12/12.

---

## Screen: Landing (`/`) — "Making a call" walkthrough in "How it works" — LOCKED (2026-06-08)

A new landing component (`components/call-walkthrough/`) drops an auto-advancing, phone-framed mock of the call flow (**Decode → Stance → Script → Call → Logged**) into the "How it works" section, so a first-time visitor *sees* how easy a call is before signing up. Built from a design handoff (`Oravan Design System Handoff.zip`), re-authored natively (no in-browser Babel).

**Placement (chose #1 of 5 rendered options):** the section becomes a **two-column split** — the existing numbered steps (unchanged copy) on the left, the walkthrough on the right — `max-w-[1100px]`, collapsing to one column under `880px` (phone drops below the steps). Columns are **vertically centered** (`items-center`) so the shorter step list brackets the taller phone instead of leaving a ragged gap. Chosen over a dedicated centered section (#2) because a centered hero followed by another centered block reads as two competing "hero" moments; the asymmetric 2-col gives the page better layout rhythm (centered hero → asymmetric → grid → centered CTA). Trade accepted: slightly less raw prominence than a standalone section, for a more composed page.

**Choreographed like a screen recording, not a slideshow:** each action screen taps its own CTA (a touch ripple + brief button press) before advancing; the Call screen shows a "Calling…" beat; the Logged medallion pops in; the Script box blinks an edit caret. Per-step timeline lives in `SCHEDULE`. It's an in-component live mock (Approach A — no video asset), so it stays crisp, **has zero runtime network dependency** (bad Wi-Fi can't stutter it, unlike a `.webm`), and is swappable for a real recording later.

**Device-mock token exception:** the phone bezel/viewport dimensions, the in-screen demo text sizes, and the tap/press motion are **literal values** (`h-[472px]`, `text-[12.5px]`, `scale-[0.97]`, the one floating `shadow-[…]`) — device/motion specifics that don't map to the global token scale. Treated as a **contained sanctioned exception**, same spirit as the locked `max-w-[65ch]`; everything outside the frame uses tokens. (Not a precedent for product/app surfaces.)

**Robustness / a11y (built in, not bolted on):**
- **Small screens:** a sizing wrapper shrinks the 288px phone's footprint and scales it to fit ≤360px — verified **no horizontal overflow at 320px**.
- **Keyboard:** all in-phone demo buttons are `tabIndex=-1` and the viewport is `aria-hidden` (decorative), so focus never lands on dead controls; the narrative is carried by the captions + the labelled step dots (`role="tab"`).
- **Reduced motion:** starts paused, no autoplay, transitions/caret/medallion all disabled. **Pause on hover/focus**; manual prev/next/dots/play-pause.
- No `aria-live` (autoplay would spam screen readers).

**Structure:** split under the 200-line cap into `CallWalkthrough.tsx` (shell + state machine), `screens.tsx` (the 5 screens + schedule), `parts.tsx` (Pill / TapCTA / StanceToggle / AppBar). Reuses the real `Button`; inlines static Pill/Stance (no such primitives exist yet). Happy-path Playwright test added to `landing.spec.ts`. Gate: lint + build + Playwright.

---

## System: Mobile nav — bottom tab bar restored (corrects #64) — LOCKED (2026-06-09)

#64 had moved mobile nav into a top masthead (mirroring desktop). That **contradicted DESIGN.md**, whose Navigation rule ends: *"Mobile is a bottom-tab bar."* This restores the documented system. Per a dedicated handoff (`Oravan-Masthead-Handoff.html`); a surgical nav change, not a rebuild.

- **Mobile masthead → slim nameplate.** The mobile `<header>` keeps only the wordmark + the Settings **gear** (and `pt-safe` so the ink band sits under the notch). No tabs — primary nav is the bottom bar.
- **New `BottomTabBar`** (`lg:hidden fixed bottom-0`, paper fill, top hairline, `pb-safe` for the home indicator): four destinations as `lucide` icon + label, ≥44px targets. The screen's **one signal-orange moment** moves from the masthead underline to the **active tab's 3px marker**.
- **Desktop masthead unchanged in shape**, but its tab set now matches the bar: `Home · Feed · Reps · Impact` (re-added **Feed → /bills**, which #64 had dropped; relabeled "My Reps"→"Reps", "Your Impact"→"Impact"). Routes are **unchanged** — only labels (`/representatives` stays; no `/reps` rename).
- **Active state** by first path segment, so `/bills/[id]` still highlights Feed. Pure `activeTabHref()` in `lib/nav/primaryTabs.ts` (unit-tested); `Masthead` + `BottomTabBar` in `components/layout/` (replaces `components/NavBar.tsx`).

**Deliberate deviations from the handoff:**
- Idle tab labels use **`ink-70`, not the handoff's `ink-50`** — DESIGN.md scopes `ink-50` to "large/disabled only", and a 12px label needs the AA floor (the #62 contrast sweep). The active marker + bold weight still distinguish the active tab.
- **Dropped the "clipped avatar" fix-in-passing** — there is **no `Avatar` component anywhere** in the codebase, so the bug it described isn't in this build (the dark "N" in dev screenshots is the Next.js dev-mode indicator).
- ZIP chip in the masthead left as an optional future add (needs the user's ZIP wired).

Note: this reverses the *feed* half of the earlier "Stack 1" too — `/bills` returns as the distinct "Feed" tab; Home and Feed are separate destinations (the category-feed redesign will land on the Feed tab). Gate: lint + build + vitest 28 + Playwright 14.
