'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { PRIMARY_TABS, activeTabHref, type PrimaryTab } from '@/lib/nav/primaryTabs'

// Mobile primary navigation — fixed to the bottom (thumb arc), paper fill, top
// hairline, safe-area inset for the home indicator. Desktop uses the masthead
// tabs instead, so this is lg:hidden. The active tab carries the screen's one
// signal-orange moment (a 3px marker above the icon).
//
// Idle uses ink-70, not the handoff's ink-50: per DESIGN.md ink-50 is "large/
// disabled only", and a 12px label needs the AA floor (the #62 contrast sweep).

function TabItem({ tab, active }: { tab: PrimaryTab; active: boolean }) {
  const Icon = tab.icon
  return (
    <Link
      href={tab.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 py-2 text-caption transition-[color,transform] duration-micro ease-standard active:scale-[0.98] motion-reduce:active:scale-100',
        active ? 'font-semibold text-ink' : 'font-medium text-ink-70',
      )}
    >
      {active && (
        <span className="absolute top-1 h-[3px] w-6 rounded-pill bg-signal" aria-hidden />
      )}
      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      {tab.label}
    </Link>
  )
}

export function BottomTabBar() {
  const pathname = usePathname()
  const active = activeTabHref(pathname)

  return (
    <nav
      aria-label="Primary"
      className="lg:hidden fixed inset-x-0 bottom-0 z-50 border-t border-divider bg-paper pb-safe"
    >
      <div className="flex">
        {PRIMARY_TABS.map((tab) => (
          <TabItem key={tab.href} tab={tab} active={active === tab.href} />
        ))}
      </div>
    </nav>
  )
}
