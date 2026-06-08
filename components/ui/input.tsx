import * as React from 'react'
import { cn } from '@/lib/utils'

// Form input atom. Consolidates the identical inline class string repeated across
// every auth / onboarding / settings / representatives field. Single style, no
// variants — so plain cn(), not cva. Appearance is unchanged from the current
// page inputs except the authorized color sweep (slate-300 → divider-strong,
// slate-900 → ink, slate-400 → ink-50). Reconciled: warm bg-paper-mid fill +
// rounded-md (control tier — crisp 8px vs the 20px surface tier) + ink focus ring.
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'w-full rounded-md border border-divider-strong bg-paper-mid px-4 py-3 text-ink',
        'placeholder:text-ink-70 transition-colors duration-micro',
        'focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent',
        'disabled:opacity-50 disabled:pointer-events-none',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export { Input }
