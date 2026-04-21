'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ selected = false, className, type = 'button', children, ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-pressed={selected}
      className={cn('chip', selected && 'is-selected', className)}
      {...props}
    >
      <span className="dot" aria-hidden="true" />
      {children}
    </button>
  )
)
Chip.displayName = 'Chip'
