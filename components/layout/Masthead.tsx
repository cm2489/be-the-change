'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings } from 'lucide-react'
import { OravanWordmark } from '@/components/brand/OravanWordmark'
import { cn } from '@/lib/utils'
import { PRIMARY_TABS, activeTabHref } from '@/lib/nav/primaryTabs'

// The ink masthead. Two variants:
//  • Desktop (lg+): the full civic header — wordmark + the section tabs with the
//    signal-orange active underline + the settings gear. (DESIGN.md "Navigation".)
//  • Mobile: a slim nameplate — wordmark + gear only, NO tabs. Primary navigation
//    on mobile is the BottomTabBar; the masthead is just identity + settings.
// The one signal-orange moment on mobile is the active bottom tab, never here.
export function Masthead({ userName }: { userName?: string }) {
  const pathname = usePathname()
  const active = activeTabHref(pathname)

  return (
    <>
      {/* Desktop masthead — ink band with section tabs + signal active underline */}
      <header className="hidden lg:flex items-stretch h-16 px-8 bg-ink sticky top-0 z-40">
        <div className="flex items-center shrink-0">
          <Link href="/dashboard">
            <OravanWordmark className="h-7 text-paper" />
          </Link>
          <span className="mx-6 h-6 w-px bg-paper/20" aria-hidden />
        </div>

        <nav className="flex items-stretch gap-7">
          {PRIMARY_TABS.map((tab) => {
            const isActive = active === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex items-center text-small font-medium transition-colors duration-micro',
                  isActive ? 'text-paper' : 'text-paper/60 hover:text-paper',
                )}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-pill bg-signal" aria-hidden />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-5">
          {userName && <span className="text-mono text-paper/50">{userName}</span>}
          <span className="h-6 w-px bg-paper/20" aria-hidden />
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex items-center gap-2 text-small text-paper/60 hover:text-paper transition-colors duration-micro"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </header>

      {/* Mobile nameplate — slim ink band, wordmark + gear, no tabs. pt-safe so the
          band extends under the status bar / notch in standalone PWA. */}
      <header className="lg:hidden sticky top-0 z-40 bg-ink pt-safe">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/dashboard" aria-label="Oravan — home">
            <OravanWordmark className="h-6 text-paper" />
          </Link>
          <Link
            href="/settings"
            aria-label="Settings"
            aria-current={pathname.startsWith('/settings') ? 'page' : undefined}
            className="flex items-center text-paper/70 transition-colors duration-micro hover:text-paper"
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </header>
    </>
  )
}
