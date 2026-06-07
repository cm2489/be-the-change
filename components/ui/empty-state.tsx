import * as React from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// Shared empty / zero-data state: a centered lucide icon + title + supporting
// line. Replaces the four hand-rolled empty states (dashboard feed, bills list,
// impact history, representatives prompt). The surface (Card vs. bare) stays the
// caller's choice so the primitive composes — wrap in <Card padding="lg"> for a
// bordered surface, or render bare for an inline prompt.
interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  className?: string
  // Optional action (e.g. a Button/Link) rendered below the supporting line.
  children?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, className, children }: EmptyStateProps) {
  return (
    <div className={cn('text-center', className)}>
      {Icon && (
        <div className="mb-3 flex justify-center">
          <Icon className="h-8 w-8 text-ink-50" strokeWidth={1.5} aria-hidden />
        </div>
      )}
      <h3 className="font-semibold text-ink mb-1">{title}</h3>
      {description && (
        <p className="text-small text-ink-70 max-w-xs mx-auto leading-relaxed">{description}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
