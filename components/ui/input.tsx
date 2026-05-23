import * as React from 'react'
import { cn } from '@/lib/utils'

// Form input atom. Consolidates the identical inline class string repeated across
// every auth / onboarding / settings / representatives field. Single style, no
// variants — so plain cn(), not cva. Appearance is unchanged from the current
// page inputs except the authorized color sweep (slate-300 → divider-strong,
// slate-900 → ink, slate-400 → ink-50); radius (rounded-xl) is already a token.
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'w-full rounded-xl border border-divider-strong bg-card px-4 py-3 text-ink',
        'placeholder:text-ink-50 transition-colors duration-[120ms]',
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
