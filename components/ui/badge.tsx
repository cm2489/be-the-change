import * as React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'urgent'
  | 'soon'
  | 'passed'
  | 'neutral'
  | 'federal'
  | 'outline'
  | 'signal'
  | 'ink'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClass: Record<BadgeVariant, string> = {
  urgent:  'badge-urgent',
  soon:    'badge-soon',
  passed:  'badge-passed',
  neutral: 'badge-neutral',
  federal: 'badge-federal',
  outline: 'badge-outline',
  signal:  'badge-signal',
  ink:     'badge-ink',
}

export function Badge({
  variant = 'neutral',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn('badge', variantClass[variant], className)} {...props}>
      {children}
    </span>
  )
}
