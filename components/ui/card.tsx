import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Surface container. Consolidates the bg-white / rounded / border block repeated
// across dashboard tiles, auth containers, and settings sections. Padding variants
// match the sizes already in use (sm = dashboard tiles p-4, md = generic p-6,
// lg = auth containers p-8). Shadow stays opt-in via className so no elevation
// level is baked in. Appearance unchanged except the authorized color sweep
// (border-slate-200 → border-divider, bg-white → bg-card, both #FFFFFF).
//
// NOTE (deferred, not a Batch-1 call): radius is rounded-2xl to match current page
// cards exactly. That value is OFF the radius token scale (sm/md/lg/xl/pill) — the
// "good" components (ScriptFlow/CallFlow) use rounded-xl. Reconciling page cards to
// a radius token is a design decision; preserved as-is here. See components/ui/README.md.
const cardVariants = cva('bg-card rounded-2xl border border-divider', {
  variants: {
    padding: {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
  },
  defaultVariants: { padding: 'md' },
})

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ padding, className }))} {...props} />
  ),
)
Card.displayName = 'Card'

export { Card, cardVariants }
