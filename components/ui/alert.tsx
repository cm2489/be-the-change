import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Inline status banner for form errors + success confirmations. Consolidates the
// `bg-red-50 border-red-200 text-red-700` box repeated across every auth /
// onboarding / settings / representatives form, mapped onto the warm palette
// (oxblood for errors, moss for success) instead of off-token red/green. `role`
// wires the screen-reader semantics each variant implies.
const alertVariants = cva('rounded-xl border p-3 text-small', {
  variants: {
    variant: {
      error: 'bg-oxblood-10 border-oxblood/20 text-oxblood',
      success: 'bg-moss-10 border-moss/20 text-moss',
    },
  },
  defaultVariants: { variant: 'error' },
})

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      role={variant === 'success' ? 'status' : 'alert'}
      className={cn(alertVariants({ variant, className }))}
      {...props}
    />
  ),
)
Alert.displayName = 'Alert'

export { Alert, alertVariants }
