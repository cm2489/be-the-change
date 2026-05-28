# Bill Detail — Floor Brief

**Owner:** Colby **Surface:** `/bills/[id]` (`app/(app)/bills/[id]/page.tsx`)
**Status:** Source of truth for the bill-detail **floor** pass. **Floor = structure, hierarchy, neutrals, states.** Color, brand, and the ceiling come after floor approval.
**Date:** 2026-05-27

This document captures the design decisions made in the prior bill-detail session (the work itself was discarded; the decisions were kept) so the `frontend-design` build loop can construct the screen correctly from scratch. Build against this doc, the tokens in `tailwind.config.ts` / `globals.css`, and `DESIGN_PLAYBOOK.md` — not from training-data defaults.

---

## 1. The feeling

**Clarity and orientation. Information-first.** The screen's job is to *remove friction and ambiguity*, not to emote at the citizen. Congressional bills are dense, procedural, and alienating — written in a register that excludes the people they affect. **This screen translates.** Every layout decision should answer one of two questions the user is silently asking:

- *What does this actually do?*
- *Why should I care?*

If an element doesn't serve orientation or translation, it doesn't belong on the floor.

---

## 2. The lead

**The hero of the screen is a plain-language brief of what the bill does — "Decoded."** This is translation, not transcription: a human-readable explanation, not the official text restated.

Consequence for hierarchy:

- The **plain-language brief is the largest, first, most prominent reading element.**
- The **official title becomes secondary reference** — present, accurate, but visually subordinate. It's the citation, not the headline.
- The bill identifier (e.g. "H.R. 4821") is a reference detail, not a hero.

This inverts the instinct to lead with the official title. The official title is what excludes people; leading with the translation is the whole point of the product.

---

## 3. What exists today (the starting point)

The current `page.tsx` is the **pre-floor** version (Features 4 & 5 wired in, no design pass). Grounding facts the build loop should know:

- **Client component.** Fetches the bill via `supabase.from('bills').select('*')`, gates on session, three top-level states: `loading`, not-found, loaded.
- **Still on raw `slate-*` + `bg-white`.** This page was *not* in the Batch 1 consolidation sweep (STATUS flags `bills/*` as carrying ~31 `slate-*`). The floor moves it onto the `ink` / `paper` / `divider` token system.
- **`displaySummary = ai_summary || summary_text`** already exists (page.tsx) but is rendered as a small gray paragraph *inside* the header card. The floor promotes this into the Decoded hero.
- **No relevance line exists today.** "Why this matters to you" is net-new — it requires fetching the user's issue priorities (`user_interests`) and intersecting with `bills.issue_tags`.
- **`urgencyLabel()` returns color** (`lib/utils.ts`: `text-red-600 bg-red-50`, orange, yellow, slate). The floor renders urgency **neutrally** — do **not** consume `urgency.color`. The label text is fine; the color mapping is a ceiling decision.
- **The "Federal" pill currently uses a 🇺🇸 emoji** + slate. Floor: neutral, no emoji (text, or a lucide glyph if one is warranted).
- **Identifier renders as a bare integer** (`bill.bill_number`). Real bills read as a citation ("H.R. 4821"). `bill_type` and `congress_number` are returned by `select('*')` even though the current `Bill` interface omits them.
- **Container:** `max-w-3xl mx-auto px-4 py-6`.
- **ScriptFlow → CallFlow** render in a stack below the header; CallFlow mounts only after a script is saved. **These are shipped Features 4 & 5 — their internals are off-limits.**

---

## 4. Structural decisions (locked from the prior session)

These are **kept**. The build loop implements them; it does not relitigate them.

### 4.1 "Decoded" is a hero card with a warm fill

- The Decoded brief lives in its own **card with a warm fill** — `bg-paper` (`#F7F4EE`), deliberately **distinct from the rest of the page.**
- **Reconciliation to verify at render:** the app shell is already `bg-paper`, and ordinary cards are white (`card` = `#FFFFFF`). For the Decoded card to read as *distinct*, the surrounding surfaces (bill header, call-script shell) should be white `card`, and/or the Decoded card uses `paper-dark` (`#EDE7D8`) + a `divider` border to separate from the shell. The intent is **"the hero is warm, the supporting surfaces are cool-white"** — confirm the contrast actually reads at 390px and desktop, don't assume.

### 4.2 The Decoded label is centered; the body is left-aligned

- The **"Decoded" label is centered** above the body text (an editorial caption — `text-meta`, the 12px tracked label style).
- The **body text is left-aligned at a readable measure (~prose width / ~65ch).** Even inside the wider `max-w-3xl` card, the brief's line length is constrained for readability.
- **This mixed alignment (centered label, left body) is intentional editorial styling, not an inconsistency.** A reviewer or critique pass should not "fix" it.

### 4.3 "Why this matters to you" is a quiet supporting line

- It sits **beneath** the Decoded card as a **quiet supporting line — NOT a second equal card.** No competing fill, no box that rivals the hero.
- It shares the **same left edge** as the Decoded card's content above it and the metadata below it — one consistent left margin runs down the column.
- It is subordinate: smaller, lighter (an ink-tint), low visual weight.

### 4.4 The relevance line has three states

"Why this matters to you" must render gracefully in all three, never blank or broken:

| State | Condition | Treatment |
|---|---|---|
| **Populated** | User has priorities **and** the bill matches | "Touches your priorities — _X_" (X = the matched issue area(s)) |
| **Empty** | User has set **no** priorities | A gentle nudge: "Set your issue priorities to see why this matters to you." (links to where they set them) |
| **No match** | Priorities set, but **none match** this bill | Handled gracefully — neither a false "matches your priorities" claim nor a jarring void. A neutral line acknowledging it doesn't intersect their stated priorities. |

Data: requires `user_interests` (the user's categories) intersected with `bills.issue_tags` (which carries subcategory **and** parent-category ids). `issue_tags` may be null on a freshly-synced bill — treat as "no match."

### 4.5 Status, urgency, and "Federal" pills stay neutral

- All pills render in **ink-tints only — no color semantics.** Urgency does not turn red/orange; status does not get a color; "Federal" is neutral.
- **Color is the ceiling's job.** The floor proves the layout works in pure neutrals first. (See §7 for the exact palette boundary.)

### 4.6 Decoded empty state

- When the brief hasn't been generated yet (`ai_summary` and `summary_text` both null), the Decoded card still renders — with an empty state:
  > "Not decoded yet — we'll translate this bill into plain language shortly."
  (or similar). The **card and its frame are always present**; only the body swaps to this message. The AI generation that fills it is a later feature (§8) — design the container and its states, not the fill mechanism.

---

## 5. The call-script section shell (in scope)

- The **container / header / layout shell** around ScriptFlow and CallFlow **is in scope.** Today it's a bare `space-y-4` stack with no framing; it needs to be brought up to **match the care of the Decoded card** — a coherent section header and container that reads as part of the same designed screen, not a bolted-on widget.
- **The components' internals are off-limits.** `ScriptFlow` and `CallFlow` are shipped Features 4 & 5 with passing Playwright specs. The floor frames them; it does not reach inside them or change their behavior, props, or markup.
- The section's relationship to the header: CallFlow only appears **after** a script is saved (`scriptSaved` gate). The shell must look intentional both **before** (script-only) and **after** (script + call) that transition.

---

## 6. States to design (not just the happy path)

Per the playbook, crafted-vs-generic shows in the non-happy states. Design all of these:

- **Loading** — replace the current `text-slate-400 "Loading…"` with an in-system treatment.
- **Not found** — replace the current `😕` emoji + slate copy with an in-system empty state and a route back to `/bills`.
- **Decoded empty** — §4.6.
- **Relevance: all three states** — §4.4.
- **Call-script shell: pre-save vs. post-save** — §5.
- **Real-data variance** — §7. The screen has to hold up on messy real bills, not just a clean fixture.

---

## 7. The cage — token vocabulary & color boundary

Build inside these. Exact names live in `tailwind.config.ts`; the relevant set:

**Neutrals the floor uses:**
- `ink` + tint family (`ink-95/85/70/50/20/10`) — text and neutral pills
- `paper` (`#F7F4EE`) / `paper-dark` (`#EDE7D8`) — warm fills (Decoded hero)
- `card` (`#FFFFFF`) — cool-white supporting surfaces
- `divider` / `divider-strong` — borders
- `graphite` family — secondary neutral text if ink-tints aren't enough

**Type scale:** `display` / `h1` / `h2` / `h3` / `body` / `small` / `meta` / `mono`. Use these, not raw `text-2xl` etc. Likely mapping: Decoded label → `meta`; Decoded body → `body` at ~65ch; official title → `small`/`meta` in an ink-tint; pills → `meta`.

**Radii / shadow / motion:** token radii (`lg` 12 / `xl` 20 / `pill`), token shadows (`sm`/`md`/`lg`), token durations. The current `rounded-2xl` is a raw value, not a token — replace with `xl`/`lg`.

**Fonts:** `serif` (Instrument Serif, headings) · `sans` (Inter Tight, body) · `mono` (JetBrains Mono).

**FORBIDDEN on the floor (these are ceiling decisions):**
- `signal` (orange) — any use, including CTAs, accents, the wordmark
- `moss` (green) / `amber` (yellow) / `oxblood` (red) — **no status color semantics of any kind**
- Any net-new color not in the token set

If a state *seems* to need color to read (e.g., urgency), that's a signal to **solve it with hierarchy and weight in neutrals on the floor**, and note it as input to the ceiling palette exercise — not to reach for color now.

---

## 8. Explicitly NOT in this floor

- **The AI generation that fills the Decoded brief.** Lazy generation is a later feature. Design the container and its empty/filled states only — not the generation trigger or pipeline.
- **Per-issue analysis** ("winners / losers / stakes" — the `issue_analysis` jsonb). That's a deferred feature; not on this screen now.
- **Color decisions of any kind.** Ceiling, after floor approval.
- **Logo / brand mark.** Deferred until brand lock.
- **ScriptFlow / CallFlow internals** (§5) — frame only.

---

## 9. Reality check — design for real Congress.gov data

The page reads on **real bills, not perfect demo fixtures.** Design for what actually comes back:

- **`ai_summary` and `summary_text` are both nullable** → the Decoded empty state (§4.6) is a real, common case, not an edge case.
- **Official titles are long and often ALL-CAPS / procedural.** The secondary-reference treatment must wrap or clamp gracefully without dominating the hero.
- **`last_action_text` is verbose committee-speak** ("Reported by the Committee on … with an amendment"). Currently `line-clamp-1`. Keep it constrained; it's metadata, not prose.
- **`issue_tags` can be null or sparse** → relevance "no match" (§4.4) is common on freshly-synced bills.
- **The identifier needs real formatting** ("H.R. 4821", "S. 1234") from `bill_type` + `bill_number`, not a bare integer.

---

## 10. For the build loop (decisions to make *with* Colby, not pre-baked)

Small open choices — resolve these *in* the screenshot loop, one at a time, not by one-shotting:

- Exact Decoded fill that reads distinct against the paper shell (`paper` vs `paper-dark` vs white supporting cards) — §4.1, **verify at render**.
- Whether the Decoded body is set in `serif` (editorial) or `sans` (`body`) — taste call, decide on the rendered output.
- Whether "Federal" / status earns a lucide glyph or stays text-only.

These are floor-level layout/hierarchy questions, all answerable in neutrals. None are color, brand, or scope decisions.
