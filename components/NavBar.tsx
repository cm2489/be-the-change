'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ClipboardList, Users, Activity, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/bills', label: 'Issues', icon: ClipboardList },
  { href: '/representatives', label: 'My Reps', icon: Users },
  { href: '/impact', label: 'Your Impact', icon: Activity },
]

export function NavBar({ userName }: { userName?: string }) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-card border-r border-divider p-6 fixed left-0 top-0">
        <div className="mb-8">
          <div className="text-xl font-bold text-ink">Oravan</div>
          <div className="text-xs text-ink-50 mt-0.5">Not political. Just powerful.</div>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-small font-medium transition-colors',
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'bg-ink-10 text-ink'
                  : 'text-ink-70 hover:bg-ink-10 hover:text-ink'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-divider">
          {userName && (
            <div className="text-small text-ink-70 mb-3">
              Signed in as <span className="font-medium text-ink-85">{userName}</span>
            </div>
          )}
          <Link
            href="/settings"
            className="flex items-center gap-2 text-small text-ink-70 hover:text-ink-85"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-divider z-50 safe-area-pb">
        <div className="flex">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-3 text-xs font-medium transition-colors',
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'text-ink'
                  : 'text-ink-50'
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
