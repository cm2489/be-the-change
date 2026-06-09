import { describe, it, expect } from 'vitest'
import { activeTabHref, PRIMARY_TABS } from '../nav/primaryTabs'

describe('activeTabHref', () => {
  it('matches each primary destination by its first path segment', () => {
    expect(activeTabHref('/dashboard')).toBe('/dashboard')
    expect(activeTabHref('/bills')).toBe('/bills')
    expect(activeTabHref('/representatives')).toBe('/representatives')
    expect(activeTabHref('/impact')).toBe('/impact')
  })

  it('keeps the Feed tab active on a bill sub-route', () => {
    expect(activeTabHref('/bills/hr-4821-119')).toBe('/bills')
  })

  it('returns null on routes that are not a primary destination', () => {
    expect(activeTabHref('/settings')).toBeNull()
    expect(activeTabHref('/onboarding')).toBeNull()
    expect(activeTabHref('/')).toBeNull()
  })

  it('exposes exactly the four destinations (Settings is the masthead gear, not a tab)', () => {
    expect(PRIMARY_TABS.map((t) => t.label)).toEqual(['Home', 'Feed', 'Reps', 'Impact'])
    expect(PRIMARY_TABS.map((t) => t.href)).toEqual([
      '/dashboard',
      '/bills',
      '/representatives',
      '/impact',
    ])
  })
})
