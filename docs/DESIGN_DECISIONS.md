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

Not re-derived here; the playbook is the source. In one breath: a **warm, editorial, civic identity** — `paper` (`#F7F4EE`) not white, dark-green `ink` (`#1F2E2A`) not slate/black, Instrument Serif headings + Inter Tight body + JetBrains Mono. **The token system is the cage; restraint is the brief.** How bold `signal`-orange gets (and whether any non-neutral color beyond it is needed) is **still being discovered through the bill-detail ceiling pass**, not decided in the abstract — so no accent-color choice is recorded as LOCKED until that pass runs.

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

**⚠ Arbitrary (non-token) values — flagged, cross-ref `docs/deferred.md#type-scale-extension`:**

- `text-[22px]` — sits in the `text-h3` (18px) → `text-h2` (24px) gap that `type-scale-extension` already flags (it lists a missing **20px** step in exactly this gap; 22px is the value this title landed on).
- `tracking-[0.02em]` — sits between `tracking-normal` (0) and `tracking-wide` (0.025em); no token exists.
- **Decision owed at screen-lock:** formalize one/both into the scale **or** document them as deliberate one-offs. Per `type-scale-extension`, only formalize a 22px step if it recurs on another surface — otherwise it stays a one-off. Either way, the call is made *once, here*; don't keep inventing inline type values on other surfaces in the meantime.

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

**Empty state (LOCKED — picked B from a 3-way centered / left / centered-italic render, 2026-05-30):** When `displaySummary` is null (no summary synced yet), the card / label / rule stay; only the body paragraph swaps to a muted "Not decoded yet" line.

**Exact empty-body classes:** `text-body text-ink-50 max-w-[65ch] mx-auto` — the **same `~65ch` left measure** as the filled body, just `ink-50` (muted). **Copy:** "Not decoded yet — we'll translate this bill into plain language shortly." (em-dash + curly apostrophe, per the editorial type).

**Why B (left at measure) over centered (A/C):** holding the empty body at the same measure + alignment as the filled body means the card **doesn't change shape** when it goes empty → decoded — only the text changes. Centered reads more like a conventional placeholder but makes the card "jump" between states. Implemented as a single conditional around the **body paragraph only** (card / label / rule render once, shared by both states).

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
| populated | `Touches your priorities — {areas}` (comma-joined) | line `text-small text-ink-50`; matched area `text-ink-85` |
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
