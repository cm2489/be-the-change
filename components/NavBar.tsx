'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 7.5L9 2l7 5.5V16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5Z"/>
        <path d="M6.5 17V11h5v6"/>
      </svg>
    ),
  },
  {
    href: '/bills',
    label: 'Issues',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="2" width="12" height="14" rx="2"/>
        <path d="M6 6h6M6 9h6M6 12h4"/>
      </svg>
    ),
  },
  {
    href: '/representatives',
    label: 'My Reps',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="6" r="3"/>
        <path d="M2.5 16c0-3.314 2.91-6 6.5-6s6.5 2.686 6.5 6"/>
      </svg>
    ),
  },
  {
    href: '/callenge',
    label: 'Callenge',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 3h8v6a4 4 0 0 1-8 0V3Z"/>
        <path d="M5 6H3a2 2 0 0 0 0 4h2M13 6h2a2 2 0 0 0 0 4h-2"/>
        <path d="M9 13v3M6.5 16h5"/>
      </svg>
    ),
  },
]

export function NavBar({ userName }: { userName?: string }) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-card border-r border-divider p-6 fixed left-0 top-0">
        {/* Wordmark */}
        <div className="mb-8">
          <div className="t-h2 text-ink">Be The Change</div>
          <div className="t-meta text-fg-3 mt-0.5">Not political. Just powerful.</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg t-small font-semibold transition-colors duration-[120ms]',
                  active
                    ? 'bg-ink text-paper'
                    : 'text-fg-2 hover:text-ink hover:bg-paper-dark'
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-5 border-t border-divider">
          {userName && (
            <div className="t-small text-fg-3 mb-3 truncate">
              {userName}
            </div>
          )}
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-2 t-small font-semibold transition-colors duration-[120ms]',
              pathname === '/settings'
                ? 'text-ink'
                : 'text-fg-2 hover:text-ink'
            )}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="2.5"/>
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.53 11.53l1.42 1.42M3.05 12.95l1.42-1.42M11.53 4.47l1.42-1.42"/>
            </svg>
            Settings
          </Link>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-divider z-50">
        <div className="flex">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-3 gap-1 t-meta transition-colors duration-[120ms]',
                  active ? 'text-ink' : 'text-fg-3'
                )}
              >
                {item.icon}
                <span style={{ fontSize: 10 }}>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
