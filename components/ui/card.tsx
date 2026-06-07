import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Surface container. Consolidates the bg-white / rounded / border block repeated
// across dashboard tiles, auth containers, and settings sections. Padding variants
// match the sizes already in use (sm = dashboard tiles p-4, md = generic p-6,
// lg = auth containers p-8). Shadow stays opt-in via className so no elevation
// level is baked in. Color uses tokens (border-divider, bg-card #FFFFFF).
//
// Radius is rounded-xl (20px token) — reconciled off the old off-scale rounded-2xl
// during the app UI-cohesion pass so every surface matches the locked components
// (BillCard V4, ScriptFlow, CallFlow, the Decoded hero). See components/ui/README.md.
const cardVariants = cva('bg-card rounded-xl border border-divider', {
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
