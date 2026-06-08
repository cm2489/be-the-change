'use client'

import { INTEREST_CATEGORIES } from '@/lib/interests'
import { cn } from '@/lib/utils'

interface IssuePickerProps {
  /** Currently selected category ids. */
  selected: Set<string>
  /** Toggle a category id in/out of the selection. */
  onToggle: (id: string) => void
  className?: string
}

/**
 * The shared issue picker — a flat grid of category cards, each showing the
 * label plus its plain-language `subline` ("decode the category"). One control
 * for both onboarding (the "pick a few to start" step) and settings (manage).
 * Controlled: the parent owns the `selected` set and persistence.
 */
export function IssuePicker({ selected, onToggle, className }: IssuePickerProps) {
  return (
    <div className={cn('grid gap-2.5 sm:grid-cols-2', className)}>
      {INTEREST_CATEGORIES.map(cat => {
        const isSelected = selected.has(cat.id)
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onToggle(cat.id)}
            aria-pressed={isSelected}
            className={cn(
              'rounded-lg border px-4 py-3 text-left transition-colors duration-micro',
              'focus-visible:shadow-focus focus-visible:outline-none',
              isSelected
                ? 'border-ink bg-ink'
                : 'border-divider bg-paper-mid hover:border-divider-strong',
            )}
          >
            <span className={cn('block text-small font-medium', isSelected ? 'text-paper' : 'text-ink')}>
              {cat.label}
            </span>
            <span className={cn('mt-0.5 block text-caption', isSelected ? 'text-paper/70' : 'text-ink-50')}>
              {cat.subline}
            </span>
          </button>
        )
      })}
    </div>
  )
}
