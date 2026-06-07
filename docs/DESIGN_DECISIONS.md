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
- The LLM `/critique` + `creative-director` ceiling passes were **not** run (deterministic `detect` clean; product-register screens cohered onto already-critiqued locked decisions) — available as a follow-up per screen.
