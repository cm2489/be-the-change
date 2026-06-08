'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ClipboardList, Users, Activity, Settings } from 'lucide-react'
import { OravanWordmark } from '@/components/brand/OravanWordmark'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/bills', label: 'Issues', icon: ClipboardList },
  { href: '/representatives', label: 'My Reps', icon: Users },
  { href: '/impact', label: 'Your Impact', icon: Activity },
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

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-divider z-50 safe-area-pb">
        <div className="flex">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-3 text-meta font-medium transition-colors',
                isActive(item.href) ? 'text-ink' : 'text-ink-50',
              )}
            >
              <item.icon className="h-5 w-5 mb-0.5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
