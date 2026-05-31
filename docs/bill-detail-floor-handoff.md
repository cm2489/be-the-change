# Bill Detail — Floor Handoff

**Date:** 2026-05-29
**Branch:** `feat/bill-detail-floor`
**Surface:** `app/(app)/bills/[id]/page.tsx`
**Source of truth (read first when resuming):** `docs/bill-detail-floor-brief.md` · this file is the *current state* against it.

This document captures the exact in-flight state of the bill-detail floor work so the next session can resume without losing the locked-in design decisions or the live slot-3 comparison. Treat exact class strings as load-bearing — they are the floor's progress, not a sketch.

---

## 1. Branch & commit state

**Branch:** `feat/bill-detail-floor` · **2 commits ahead of `main`:**

- `8588011` — `docs: add bill-detail floor brief` (the source-of-truth brief)
- `6c66edc` — `docs: log parked bill-detail ideas + Challenge-nav/noindex notes`

**One uncommitted modification:** `app/(app)/bills/[id]/page.tsx` (mid-iteration — slot 3 body comparison live in the file). Nothing else dirty.

If the working tree is lost before the next session, rebuild slot 1, slot 2, and the slot 3 surface from §3–§5 below. The four slot-3 body variants are also fully captured in §5.

---

## 2. The six-slot stack (Option A composition)

The chosen composition is **Option A — title above, Decoded below** (the other two compositions are gone, not commented). Vertical order on the page:

```
← Back
SLOT 1  status bar         (LOCKED)
SLOT 2  official title     (LOCKED)
SLOT 3  Decoded hero card  (SURFACE LOCKED · body iterating)
SLOT 4  relevance line     (UNTOUCHED · bones placeholder)
SLOT 5  metadata row       (UNTOUCHED · bones placeholder)
SLOT 6  call-script shell  (UNTOUCHED · bones placeholder)
```

Container: `<div className="max-w-3xl mx-auto px-4 py-6">`

---

## 3. SLOT 1 — Status bar — **LOCKED**

Treatment: **ring-outline neutral pills + mono citation identifier.** No color (urgency's `.color` from `urgencyLabel()` is deliberately *not* consumed — neutrals only per brief §4.5). No emoji on Federal (dropped the 🇺🇸 from the pre-floor version).

```tsx
{/* SLOT 1 — status bar · ring-outline neutral pills + mono citation id */}
<div className="flex items-center gap-2 flex-wrap mb-4">
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-pill border border-divider text-ink-70 text-meta uppercase">{urgency.label}</span>
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-pill border border-divider text-ink-70 text-meta uppercase">Federal</span>
  <span className="font-mono text-meta text-ink-50 ml-1">{identifier}</span>
</div>
```

Supporting helpers used by this slot:
- `urgency` = `urgencyLabel(bill.urgency_score)` — only `.label` is consumed.
- `identifier` = `billIdentifier(bill.bill_type, bill.bill_number)` — new helper at `page.tsx:33`, maps bill types (`hr → H.R.`, `s → S.`, `hjres → H.J.Res.`, `sjres → S.J.Res.`, `hres → H.Res.`, `sres → S.Res.`, `hconres → H.Con.Res.`, `sconres → S.Con.Res.`) to formal Congress citations.
- `bill_type: string` was added to the `Bill` interface to support this.

---

## 4. SLOT 2 — Official title — **LOCKED**

Treatment: **sans uppercase "Official title" kicker + serif italic body.** This is the hybrid the design loop settled on after comparing 7 stacked variants (sans/serif/mono × size × labeled).

```tsx
{/* SLOT 2 — official title · sans "Official title" kicker (text-meta uppercase
    ink-50) + serif italic body (22px / font-medium / ink-70 / leading-relaxed /
    tracking 0.02em). LOCKED. Two arbitrary values used (22px, 0.02em) — both
    candidates for the type-scale-extension item in deferred.md. */}
<div className="mb-8">
  <p className="text-meta uppercase tracking-widest text-ink-50 mb-1.5">Official title</p>
  <p className="font-serif italic font-medium text-[22px] text-ink-70 leading-relaxed tracking-[0.02em]">{bill.title}</p>
</div>
```

**Two arbitrary (non-token) values in play:** `text-[22px]` and `tracking-[0.02em]`. See §8 for the deferred-item link.

---

## 5. SLOT 3 — Decoded hero card — **SURFACE LOCKED, BODY ITERATING**

### 5a. Surface — LOCKED

Treatment: **floating warmth** — `paper-dark` warm fill, soft shadow lift, no border, `rounded-xl`, generous padding. This is the brief §4.1 distinct-from-shell intent realized via depth rather than a frame. Picked from four surface variants (bordered editorial / floating warmth / sharp callout / spacious magazine).

**Exact surface class string (applied per variant during iteration; will be the only card wrapper once body locks):**

```
bg-paper-dark shadow-md rounded-xl px-8 py-9
```

### 5b. Card interior label — provisional baseline (held constant across variants)

Held to the brief's pointed default so the only variable during body comparison is the body. Iterates after body locks (per the comment in the slot).

```tsx
<p className="text-meta uppercase tracking-widest text-ink-50 text-center mb-5">Decoded</p>
```

### 5c. Card interior body — **MID-ITERATION · four variants stacked, none chosen yet**

All four variants lean warm-subtle per `project_decoded_card_warm_polar_opposite.md` (§7). All use `text-ink-85` (softened ink) and `max-w-[65ch] mx-auto` (block-centered, left-aligned text). All consume `{displaySummary ?? STUB_DECODED}` as content.

**Wrapper:** `<div className="mb-8 space-y-8"> … </div>` containing four variant blocks, each with the structure:

```tsx
<div>
  <p className="text-xs font-mono text-slate-400 mb-1.5">option N · …</p>
  <div className="bg-paper-dark shadow-md rounded-xl px-8 py-9">
    <p className="text-meta uppercase tracking-widest text-ink-50 text-center mb-5">Decoded</p>
    <p className="{VARIANT_BODY_CLASSES} max-w-[65ch] mx-auto">
      {displaySummary ?? STUB_DECODED}
    </p>
  </div>
</div>
```

**The four `VARIANT_BODY_CLASSES` (exact strings):**

| Option | Dev caption | Body classes |
|---|---|---|
| 1 | `option 1 · serif body · relaxed · ink-85` | `font-serif text-body text-ink-85 leading-relaxed` |
| 2 | `option 2 · serif 18px · relaxed · ink-85` | `font-serif text-[18px] text-ink-85 leading-relaxed` |
| 3 | `option 3 · sans body · loose · ink-85` | `text-body text-ink-85 leading-loose` |
| 4 | `option 4 · serif body · loose · ink-85` | `font-serif text-body text-ink-85 leading-loose` |

**On lock — clean-up checklist:**

1. Delete the three rejected variants entirely (no commented-out blocks — per `[[no-dead-code-for-reference]]`).
2. Remove the dev caption `<p className="text-xs font-mono text-slate-400 mb-1.5">…</p>`.
3. Collapse the outer wrapper `space-y-8` → simple `mb-4` (the bones rhythm: relevance line hugs the card it explains).
4. **Delete `STUB_DECODED`** (the module-level constant at `page.tsx:29-30`) and switch the body's content prop from `{displaySummary ?? STUB_DECODED}` → `{displaySummary}`. Then design the empty state per brief §4.6 ("Not decoded yet — we'll translate this bill into plain language shortly.") — it is not built yet.
5. Update the slot-3 comment to record the locked body treatment (size / family / weight / leading / ink shade) for traceability.

### 5d. `STUB_DECODED` — iteration-only scaffolding

```ts
// page.tsx:27-30
// Iteration-only fallback so body-type comparisons have real prose to read
// against when a bill's summary hasn't been synced. Remove when slot 3 locks.
const STUB_DECODED =
  "Establishes a federal grant program to modernize how constituents reach their representatives, requiring House and Senate offices to publish a direct constituent-services line and to report quarterly on response times. Authorizes new funding over five years and directs the GAO to study accessibility for rural and disabled callers."
```

**This must be deleted when slot 3 body locks.** It exists only so the body comparison has real prose to read against on bills with null summaries. Carrying it past lock would be dead code (violates `[[no-dead-code-for-reference]]`).

---

## 6. SLOTS 4, 5, 6 — **UNTOUCHED · still bones placeholders**

Verbatim:

```tsx
{/* SLOT 4 — RELEVANCE LINE (quiet supporting line beneath the card) */}
<div className="mb-8 h-4 w-72 rounded bg-slate-100" />

{/* SLOT 5 — METADATA ROW (last action · Full text) */}
<div className="mb-10 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
  <div className="h-3 w-1/2 rounded bg-slate-100" />
  <div className="h-3 w-16 rounded bg-slate-100" />
</div>

{/* SLOT 6 — CALL-SCRIPT SECTION (shell only) */}
<div className="rounded-2xl border border-slate-200 bg-white p-6">
  <div className="mb-6 h-3 w-28 rounded bg-slate-100" />
  <div className="h-28 rounded bg-slate-100" />
</div>
```

These three slots still use raw `slate-*` placeholders and `rounded-2xl` (a non-token radius). They have not been brought into the design system yet — the slot 6 shell in particular needs to be brought up to match the Decoded card's care per brief §5 (it must read as part of the same designed screen, not a bolted-on widget).

Slot 4's three relevance states (populated / empty / no-match-but-priorities-set, per brief §4.4) are also not built and require fetching `user_interests` and intersecting with `bill.issue_tags` — net-new data plumbing for this surface.

---

## 7. The concept — Decoded as the polar opposite of the cold institutional bill

This is the **load-bearing thematic intent** for the Decoded card and the lens through which every interior slot-3 decision is judged. Captured in full at:

`~/.claude/projects/-Users-colbymaxwell-Projects-be-the-change/memory/project_decoded_card_warm_polar_opposite.md`

**The gist (do not reduce this to a one-liner in conversation — refer to the memory):**

- **The bill itself reads as cold and institutional** — the official title in formal serif italic citation form, the procedural language, the H.R./S. identifier. That coldness is real and accurate to what a federal bill is.
- **Decoded is the polar opposite — warm, kind, plain-spoken.** That warmth is what makes the card function as the *hero*, not just its visual prominence. The hero job is **translation, ease, "I see you" energy.**
- **Warmth comes from many SUBTLE touches combined, not one overt move.** Touches already in play: `bg-paper-dark` warm fill, `shadow-md` lift (no cold rigid border), centered editorial label, body confined to ~65ch readable measure. Touches still to land: body type (in flight), label exact treatment, internal spacing rhythm, ink shade nuance.
- **No single touch should announce warmth.** Warmth should accumulate into a felt-before-named quality.
- **Boundary:** warm-subtle is the *flavor*. It does not override the brief's locks (neutrals only, no signal color, ~65ch measure, mixed-alignment label+body). When a candidate warm touch fights a brief lock, the brief wins.

**Why this matters for resuming:** when proposing variants for slot 3's interior (body finish, label nuance, internal spacing), filter through *"does this add a subtle warm note, or does it bring in cold institutional energy?"* Cold-clinical options should not be proposed unless explicitly serving as a contrast baseline.

---

## 8. Open question — serif title × serif body family contrast

**The tension** to resolve at the render when picking among the four slot-3 body variants:

- The official title (slot 2, LOCKED) is **`font-serif italic`** — formal serif citation form, deliberately cold/institutional register.
- Slot 3 body variants 1, 2, and 4 are also **`font-serif`** (regular, not italic). Variant 3 is sans (`Inter Tight`).
- **If body is serif:** family is shared between the cold thing (title) and the warm thing (Decoded body). Could read as **editorial coherence** (serif throughline, refined unified voice) OR could **blur the cold/warm distinction** (the family is doing two jobs at once, weakening either).
- **If body is sans (variant 3):** clean family-level contrast — serif italic = the formal citation, sans = the plain-spoken explanation. Warmth in this variant comes from `leading-loose` + `text-ink-85`, not from the typeface itself.

**This is the central judgment call** in slot 3's body decision. Decide on the rendered output, not abstractly. Brief §10 explicitly flags it as a build-loop call.

---

## 9. Arbitrary type-scale values & the deferred item

Slot 2 (locked) uses two arbitrary, non-token values:

- `text-[22px]` — sits in the gap between token `text-h3` (18px) and `text-h2` (24px).
- `tracking-[0.02em]` — sits between `tracking-wide` (0.025em) and `tracking-normal` (0em); not currently a token.

**These connect directly** to the `type-scale-extension` deferred item in `docs/deferred.md`, which already flags **"12px-non-uppercase / 18px-body / 20px / 30px gaps"** as missing rungs in the type scale. The 22px is exactly in that gap, doing real type-scale-discovery work on a real surface.

**Decision still owed (post-floor):** keep `text-[22px]` / `tracking-[0.02em]` as one-off arbitrary values, or formalize one or both into the token system. Defer the call until floor sign-off — and only formalize if 22px shows up in more than one surface (otherwise it stays a one-off).

Slot 3's `text-[18px]` in body variant 2 is *also* arbitrary, but already exists as token `text-h3` (18px is the h3 size). It was written as arbitrary to keep the body's lineHeight/tracking from inheriting h3's display defaults; if variant 2 is picked, swap to `text-h3` and add explicit `leading-relaxed`/`tracking-*` overrides.

---

## 10. Other state worth knowing

- **Loading state** (`page.tsx:83-89`): still the **original pre-floor** version — `text-slate-400 Loading…` centered. Not rewritten. Replace when slot 3 locks (per brief §6).
- **Not-found state** (`page.tsx:91-101`): still original — `😕` emoji + `text-slate-500 Bill not found.` + a Button to `/bills`. Not rewritten. Replace when slot 3 locks (per brief §6).
- **Back button** (`page.tsx:113-119`): still raw `text-sm text-slate-400 hover:text-slate-600` — explicit `kept as-is; restyled when we reach it` comment. Restyle in the cleanup pass after the six slots are filled.
- **`cn` import** (`page.tsx:10`): now unused — was for `urgency.color`. Will be removed in the lint sweep at the end of the floor.
- **`formatDate` import**: imported but unused until slot 5 (metadata row) is filled. Leave as-is for now.
- **`urgencyLabel`**: still imported and used; only `.label` is consumed (`.color` deliberately ignored).
- **`Bill` interface**: `bill_type: string` was added to support `billIdentifier`. No other shape changes.

---

## 11. Resuming — recommended order

1. **Read first:** `docs/bill-detail-floor-brief.md` (the locked source of truth) and `~/.claude/projects/.../memory/project_decoded_card_warm_polar_opposite.md` (the warm-subtle lens).
2. **Skim this doc** for current state and §8's open family-contrast question.
3. **Decide slot 3's body** by looking at the four rendered variants live in the browser at both desktop and 390 — through the warm-subtle lens, with the serif-title × serif-body tension explicit.
4. **Lock slot 3 body** — execute the §5c clean-up checklist (delete three rejects, drop the dev caption, collapse to `mb-4`, delete `STUB_DECODED`, switch to `{displaySummary}`, update slot-3 comment).
5. **Iterate slot 3 label** next (small open variations on the brief baseline — case, weight, optional glyph, optional underline rule, etc.).
6. **Build slot 3's empty state** per brief §4.6 — the Decoded card stays present, only the body swaps to "Not decoded yet — we'll translate this bill into plain language shortly." (or similar).
7. **Move outward**: slot 4 (relevance line · three states · needs `user_interests` fetch), slot 5 (metadata row), slot 6 (call-script shell — brief §5 says match the Decoded card's care; do NOT touch ScriptFlow/CallFlow internals).
8. **Cleanup pass at end**: restyle Back, restyle loading state, restyle not-found state, drop unused `cn` import, run lint + Playwright before commit.

---

## 12. Quick reference — current `page.tsx` anatomy

```
Imports + interface + STUB_DECODED + billIdentifier helper
└── BillDetailPage()
    ├── state: bill, loading, scriptSaved, scriptGenerationId
    ├── useEffect: fetch session + bill via supabase
    ├── early return: loading state (ORIGINAL slate, untouched)
    ├── early return: not-found state (ORIGINAL emoji + slate, untouched)
    ├── computed: urgency, displaySummary, identifier
    └── return main JSX:
        ├── Back button (ORIGINAL slate, untouched)
        ├── SLOT 1 status bar (LOCKED)
        ├── SLOT 2 official title (LOCKED)
        ├── SLOT 3 Decoded card (SURFACE LOCKED · 4 body variants stacked)
        ├── SLOT 4 relevance line (bones placeholder)
        ├── SLOT 5 metadata row (bones placeholder)
        └── SLOT 6 call-script shell (bones placeholder)
```
