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

Token mapping applied (the authorized sweep): `border-slate-300 → border-divider-strong`,
`border-slate-200 → border-divider`, `text-slate-900 → text-ink`,
`placeholder-slate-400 → text-ink-50`, `bg-white → bg-card`.

## Adoption

Primitives are **not yet wired into the pages** — that happens in the Chunk 3
sweep (`slate-*` → tokens, raw sizes → type scale, emoji → lucide), which replaces
the inline markup with these components. Created first so the sweep composes from
them instead of being reworked later.

## Deferred (need a design decision — out of Batch 1 scope)

- **`Badge` primitive not built yet.** Status / relevance pills render at 12px
  non-uppercase (`text-xs`), but the type scale has no matching token — `text-meta`
  is 12px **uppercase + tracked**, which would change appearance. Adding a
  non-uppercase 12px token (or accepting `text-meta` for pills) is a design call.
  Handled inline during the sweep until then.
- **Card radius is off-token.** Page cards use `rounded-2xl` (16px, a Tailwind
  default), which isn't on the radius scale (`sm/md/lg/xl/pill`); the good
  components use `rounded-xl` (20px token). `Card` preserves `rounded-2xl` to avoid
  a visual change now; reconciling to a token is a later design decision.
