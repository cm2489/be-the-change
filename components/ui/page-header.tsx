import * as React from 'react'
import { cn } from '@/lib/utils'

// Page title block shared across app routes (dashboard, bills, impact, settings,
// representatives). Centralizes the page-title treatment: Instrument Serif at
// `text-h2`, matching the landing hero + bill-detail serif voice. The app pages
// previously set page titles in sans `font-bold`, which forced a synthetic
// faux-bold on the serif h1/h2 base rule — inconsistent with the system. Serif
// here is the page-title voice; in-card section labels stay sans-600.
interface PageHeaderProps {
  title: string
  description?: string
  // Optional right-aligned slot (e.g. a header action). When present the block
  // becomes a flex row; otherwise it stacks.
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div
      className={cn('mb-6', action && 'flex items-start justify-between gap-4', className)}
    >
      <div>
        <h1 className="font-serif text-h2 text-ink">{title}</h1>
        {description && <p className="text-small text-ink-70 mt-1">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
