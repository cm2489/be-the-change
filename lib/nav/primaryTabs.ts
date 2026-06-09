import { Home, LayoutGrid, Users, BarChart2, type LucideIcon } from 'lucide-react'

// The primary destinations, shared by the desktop masthead tabs and the mobile
// bottom tab bar. Settings is NOT here — it lives in the masthead gear. Routes are
// kept as-is (no renames); only the labels changed from the old set
// ("My Reps" → "Reps", "Your Impact" → "Impact", added "Feed" → /bills).
export type PrimaryTab = { href: string; label: string; icon: LucideIcon }

export const PRIMARY_TABS: PrimaryTab[] = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/bills', label: 'Feed', icon: LayoutGrid },
  { href: '/representatives', label: 'Reps', icon: Users },
  { href: '/impact', label: 'Impact', icon: BarChart2 },
]

// First path segment of a route ('/bills/123' → 'bills').
function firstSegment(path: string): string {
  return path.split('/').filter(Boolean)[0] ?? ''
}

// Active tab = the one whose first path segment matches the current path's first
// segment, so a sub-route like /bills/[id] still highlights "Feed". Returns null
// on routes that aren't a primary destination (e.g. /settings, /onboarding).
// Pure + unit-tested.
export function activeTabHref(pathname: string): string | null {
  const current = firstSegment(pathname)
  return PRIMARY_TABS.find((tab) => firstSegment(tab.href) === current)?.href ?? null
}
