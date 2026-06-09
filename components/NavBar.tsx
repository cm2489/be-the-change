'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings } from 'lucide-react'
import { OravanWordmark } from '@/components/brand/OravanWordmark'
import { cn } from '@/lib/utils'

// Shared section links, rendered identically on both mastheads (desktop band +
// mobile band). "Issues" was dropped once the dashboard became the feed — Home
// now opens the feed, and "See all" still bridges to /bills. Settings is not a
// section link: it lives in the top-right utility slot of both mastheads.
const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home' },
  { href: '/representatives', label: 'My Reps' },
  { href: '/impact', label: 'Your Impact' },
]

export function NavBar({ userName }: { userName?: string }) {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {/* Desktop masthead — distinct ink-green band over the warm body */}
      <header className="hidden lg:flex items-stretch h-16 px-8 bg-ink sticky top-0 z-40">
        <div className="flex items-center shrink-0">
          <Link href="/dashboard">
            <OravanWordmark className="h-7 text-paper" />
          </Link>
          <span className="mx-6 h-6 w-px bg-paper/20" aria-hidden />
        </div>

        <nav className="flex items-stretch gap-7">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex items-center text-small font-medium transition-colors duration-micro',
                  active ? 'text-paper' : 'text-paper/60 hover:text-paper',
                )}
              >
                {item.label}
                {active && (
                  <span
                    className="absolute inset-x-0 -bottom-px h-0.5 rounded-pill bg-signal"
                    aria-hidden
                  />
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

      {/* Mobile masthead — the desktop ink band, moved to the top of the screen
          and stacked to fit: wordmark + Settings gear on the brand row, the
          section nav with the same signal-underline active state below. Settings
          sits in the top-right utility slot exactly as on desktop (reachable
          without a bottom tab). Sticky so it stays put as the feed scrolls. */}
      <header className="lg:hidden sticky top-0 z-40 bg-ink">
        <div className="flex items-center justify-between h-14 px-4">
          <Link href="/dashboard" aria-label="Oravan — home">
            <OravanWordmark className="h-6 text-paper" />
          </Link>
          <Link
            href="/settings"
            aria-label="Settings"
            aria-current={isActive('/settings') ? 'page' : undefined}
            className={cn(
              'flex items-center transition-colors duration-micro',
              isActive('/settings') ? 'text-paper' : 'text-paper/60 hover:text-paper',
            )}
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>

        <nav className="flex items-stretch gap-6 h-11 px-4 border-t border-paper/10">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex items-center text-small font-medium transition-colors duration-micro',
                  active ? 'text-paper' : 'text-paper/60 hover:text-paper',
                )}
              >
                {item.label}
                {active && (
                  <span
                    className="absolute inset-x-0 -bottom-px h-0.5 rounded-pill bg-signal"
                    aria-hidden
                  />
                )}
              </Link>
            )
          })}
        </nav>
      </header>
    </>
  )
}
