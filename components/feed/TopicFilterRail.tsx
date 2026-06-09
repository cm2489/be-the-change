'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TopicFilterRailProps {
  categories: { id: string; label: string }[] // the user's selected interest categories
  value: 'all' | string
  onChange: (value: 'all' | string) => void
}

// Sticky-under-the-masthead chip rail that FILTERS the flat feed by topic (no
// scroll-jump, no sections). Active chip is ink (never orange — the one
// signal-orange per screen is the active bottom tab). "All topics" appears with
// ≥2 interests; a dashed "Add" link appears with exactly 1.
export function TopicFilterRail({ categories, value, onChange }: TopicFilterRailProps) {
  const showAll = categories.length >= 2
  const showAdd = categories.length === 1

  const base =
    'inline-flex min-h-[44px] shrink-0 items-center rounded-pill px-4 text-control font-medium transition-colors duration-micro focus-visible:shadow-focus focus-visible:outline-none'
  const chipClass = (selected: boolean) =>
    cn(base, selected ? 'bg-ink text-paper' : 'border border-divider-strong text-ink-70 hover:text-ink')

  return (
    <div className="sticky top-14 z-30 -mx-4 border-b border-divider bg-paper lg:top-16">
      <div className="flex gap-2 overflow-x-auto px-4 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {showAll && (
          <button
            type="button"
            onClick={() => onChange('all')}
            aria-pressed={value === 'all'}
            className={chipClass(value === 'all')}
          >
            All topics
          </button>
        )}
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onChange(category.id)}
            aria-pressed={value === category.id}
            className={chipClass(value === category.id)}
          >
            {category.label}
          </button>
        ))}
        {showAdd && (
          <Link
            href="/onboarding"
            className={cn(
              base,
              'border border-dashed border-divider-strong text-ink-70 hover:text-ink',
            )}
          >
            <Plus className="mr-1 h-4 w-4" aria-hidden /> Add
          </Link>
        )}
      </div>
    </div>
  )
}
