import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hero?: boolean
  interactive?: boolean
  asChild?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ hero, interactive, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        hero ? 'card-hero' : 'card',
        interactive && 'card-interactive',
        className
      )}
      {...props}
    />
  )
)
Card.displayName = 'Card'
