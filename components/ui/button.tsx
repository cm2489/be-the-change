import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva('btn', {
  variants: {
    variant: {
      primary:     'btn-primary',
      action:      'btn-action',
      outline:     'btn-outline',
      ghost:       'btn-ghost',
      secondary:   'btn-secondary',
      destructive: 'btn-destructive',
      chip:        'btn-chip',
      pill:        'btn-pill',
      // Aliases: older call sites use default/signal
      default:     'btn-primary',
      signal:      'btn-action',
    },
    size: {
      default: '',
      sm:      'btn-sm',
      lg:      'btn-lg',
      xl:      'btn-xl',
      icon:    'btn-chip',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'default',
  },
})

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    // btn-primary reveals a signal underline under its label; wrap text in .btn-label
    const wrap = variant === 'primary' || variant === 'default' || variant == null
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      >
        {wrap ? <span className="btn-label">{children}</span> : children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
