import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans font-semibold text-control transition-colors duration-micro focus-visible:outline-none focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98] select-none',
  {
    variants: {
      variant: {
        default:   'bg-ink text-paper hover:bg-ink-hover rounded-md',
        signal:    'bg-signal text-white hover:bg-signal-hover rounded-md',
        outline:   'border border-ink bg-transparent text-ink hover:bg-ink/5 rounded-md',
        ghost:     'bg-transparent text-ink hover:underline',
        secondary: 'bg-paper-dark text-ink hover:bg-divider-strong rounded-md',
        destructive: 'bg-transparent text-oxblood hover:bg-oxblood-10 rounded-md',
      },
      size: {
        default: 'h-11 px-[18px]',
        sm:      'h-9 px-3',
        lg:      'h-12 px-6 text-small',
        icon:    'h-11 w-11 rounded-md border border-divider-strong',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
