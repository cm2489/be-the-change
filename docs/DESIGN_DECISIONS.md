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
- Body: `font-serif italic font-medium text-[22px] text-ink-70 leading-relaxed tracking-[0.02em]`

**Why:** Serif italic in a tightened, tracked setting reads as formal citation form — accurate to what a federal bill *is* (procedural, excluding). Placing it under a small kicker and *below* the would-be hero inverts the instinct to lead with the official title; leading with the plain-language translation is the whole point of the product. `ink-70` (not full `ink`) keeps it present but secondary.

**⚠ Arbitrary (non-token) values — flagged, cross-ref `docs/deferred.md#type-scale-extension`:**

- `text-[22px]` — sits in the `text-h3` (18px) → `text-h2` (24px) gap that `type-scale-extension` already flags (it lists a missing **20px** step in exactly this gap; 22px is the value this title landed on).
- `tracking-[0.02em]` — sits between `tracking-normal` (0) and `tracking-wide` (0.025em); no token exists.
- **Decision owed at screen-lock:** formalize one/both into the scale **or** document them as deliberate one-offs. Per `type-scale-extension`, only formalize a 22px step if it recurs on another surface — otherwise it stays a one-off. Either way, the call is made *once, here*; don't keep inventing inline type values on other surfaces in the meantime.

### Slot 3 — "Decoded" hero card — SURFACE LOCKED (2026-05-29); body iterating

**Surface treatment (LOCKED):** "Floating warmth" — a warm fill + soft shadow lift, **no border**, large radius, generous padding. Realizes the brief §4.1 "distinct-from-shell" intent via *depth* rather than a frame. Chosen from 4 surface variants (bordered editorial / floating warmth / sharp callout / spacious magazine).

**Exact surface classes:** `bg-paper-dark shadow-md rounded-xl px-8 py-9`

**Why:** `paper-dark` (`#EDE7D8`) reads warmer than both the `paper` app shell and the white (`card`) supporting surfaces, so the hero is the warm thing and its neighbors stay cool-white — the contrast that makes it *the hero*. `shadow-md` lifts it without a cold, rigid border; `rounded-xl` (20px) softens; the padding gives the translation room to breathe.

**Still open (not locked):** the body type (serif vs sans, leading, ink shade — see the central tension in `docs/bill-detail-floor-handoff.md` §8) and the card's interior label. The label is held to a provisional baseline (`text-meta uppercase tracking-widest text-ink-50 text-center mb-5`, centered) so the only variable during the body comparison is the body itself; it iterates after the body locks.

### Concept (LOCKED) — "Decoded" as the warm polar opposite of the cold institutional bill

The **load-bearing thematic intent** for the Decoded card — the lens every slot-3 interior decision is judged through.

- The **bill itself is cold and institutional** — formal serif-italic citation title, procedural language, the H.R./S. identifier. That coldness is real and accurate to what a federal bill is.
- **Decoded is the polar opposite — warm, kind, plain-spoken.** That warmth is what makes the card the *hero* (translation, ease, "I see you" energy), not just its visual prominence.
- **Warmth comes from many SUBTLE touches combined, never one overt move** — warm fill, soft lift (no rigid border), centered editorial label, body confined to a ~65ch readable measure (`max-w-[65ch] mx-auto`), softened `ink-85` body ink. It should be **felt before named**; no single touch announces it.
- **Boundary:** warm-subtle is the *flavor*, not a license to break a floor lock. It does not override neutrals-only, no-`signal`-color, the ~65ch measure, or the centered-label/left-aligned-body mix. When a warm candidate fights a brief lock, **the brief wins**.

Full capture: project memory `project_decoded_card_warm_polar_opposite.md`. When proposing slot-3 interior variants, filter each through *"does this add a subtle warm note, or bring in cold institutional energy?"* — cold-clinical options only as explicit contrast baselines.
