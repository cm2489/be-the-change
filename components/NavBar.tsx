'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: '🏠' },
  { href: '/bills', label: 'Issues', icon: '📋' },
  { href: '/representatives', label: 'My Reps', icon: '👤' },
  { href: '/callenge', label: 'Callenge', icon: '🏆' },
]

export function NavBar({ userName }: { userName?: string }) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-slate-200 p-6 fixed left-0 top-0">
        <div className="mb-8">
          <div className="text-xl font-bold text-civic-600">Be The Change</div>
          <div className="text-xs text-slate-400 mt-0.5">Not political. Just powerful.</div>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'bg-civic-50 text-civic-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-200">
          {userName && (
            <div className="text-sm text-slate-500 mb-3">
              Signed in as <span className="font-medium text-slate-700">{userName}</span>
            </div>
          )}
          <Link
            href="/settings"
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
          >
            ⚙️ Settings
          </Link>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-pb">
        <div className="flex">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-3 text-xs font-medium transition-colors',
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'text-civic-600'
                  : 'text-slate-400'
              )}
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
