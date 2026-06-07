# UI primitives

Small set of reusable atoms built on the same pattern as `button.tsx`
(`cva` for variants + `cn` for class merging, `forwardRef`, typed props). They
exist so pages stop repeating long inline class strings and instead compose from
the design system. All styling uses **only** existing `tailwind.config.ts` tokens
— no new colors or sizes.

## Derivation principle

Each primitive **reproduces the current page appearance**, changing only what the
Batch 1 system-consolidation sweep authorizes: the color `slate-*` → token
mapping. Structure not in that sweep (radius, spacing) is preserved as-is, and any
off-token value is flagged below rather than silently re-decided. So adopting a
primitive during the Chunk 3 sweep is a near-zero-visual-change swap (the only
intended shift is cool slate grays → the warm palette).

## The set

| Primitive | File | Variants | Derived from |
|---|---|---|---|
| `Button` | `button.tsx` | `variant` (default/signal/outline/ghost/secondary/destructive), `size` (default/sm/lg/icon) | existing |
| `Input` | `input.tsx` | none (single style) | the inline input class repeated across all auth/onboarding/settings/representatives fields |
| `Card` | `card.tsx` | `padding` (none/sm/md/lg) | dashboard tiles, auth containers, settings sections |
| `Alert` | `alert.tsx` | `variant` (error/success) | the `bg-red-50 border-red-200 text-red-700` form banner repeated across every auth/onboarding/settings/representatives form, remapped to oxblood/moss |
| `EmptyState` | `empty-state.tsx` | none (icon + title + description, optional action) | the four hand-rolled zero-data states (dashboard feed, bills list, impact history, representatives prompt) |
| `PageHeader` | `page-header.tsx` | none (title + optional description/action) | the page-title block repeated across dashboard/bills/impact/settings/representatives; centralizes the serif page-title treatment |

Token mapping applied (the authorized sweep): `border-slate-300 → border-divider-strong`,
`border-slate-200 → border-divider`, `text-slate-900 → text-ink`,
`placeholder-slate-400 → text-ink-50`, `bg-white → bg-card`.

## Adoption

The original consolidation sweep (`slate-*` → tokens, raw sizes → type scale,
emoji → lucide) was completed during the **app UI-cohesion pass** — these
primitives are now wired across the app routes, replacing the inline markup they
were derived from. The locked benchmark surfaces (landing, `/bills/[id]`,
`BillCard`) own their own bespoke markup by design and don't compose from this set.

## Resolved during the cohesion pass

- **Card radius reconciled to the token.** `Card` (and the raw page cards that
  matched it) moved `rounded-2xl` (16px, off-scale) → `rounded-xl` (20px token), so
  every surface now matches the locked components (BillCard V4, ScriptFlow,
  CallFlow, the Decoded hero).

## Deferred (need a design decision)

- **`Badge` primitive not built yet.** Status / relevance / party pills render at
  12px, but the type scale has no non-uppercase 12px token — `text-meta` is 12px
  **uppercase + tracked**. The locked card pills already standardize on
  `text-meta uppercase`; extracting a shared `Badge` would mean touching that locked
  markup, so it stays deferred. Pills are handled inline until a token decision lands.
