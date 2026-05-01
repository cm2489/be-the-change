import { describe, it, expect } from 'vitest'
import {
  deriveDisplayStatus,
  RECENTLY_INTRODUCED_WINDOW_DAYS,
} from '../congress'

// All tests pass an explicit `now` Date so behavior is deterministic
// and independent of wall-clock time. Reference now: 2026-04-30. Each
// case constructs introducedDate relative to it.

const NOW = new Date('2026-04-30T12:00:00Z')

function daysAgo(n: number): string {
  const d = new Date(NOW)
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10) // YYYY-MM-DD, matches Postgres `date`
}

describe('deriveDisplayStatus', () => {
  it('returns "introduced" for committee bill introduced 3 days ago', () => {
    expect(deriveDisplayStatus('committee', daysAgo(3), NOW)).toBe('introduced')
  })

  it('returns "committee" for committee bill introduced 10 days ago', () => {
    expect(deriveDisplayStatus('committee', daysAgo(10), NOW)).toBe('committee')
  })

  it('returns "committee" at the exact 7-day boundary (day 7 ages out)', () => {
    // The < comparison in deriveDisplayStatus is intentional: at exactly
    // RECENTLY_INTRODUCED_WINDOW_DAYS the bill rolls forward.
    expect(RECENTLY_INTRODUCED_WINDOW_DAYS).toBe(7)
    expect(deriveDisplayStatus('committee', daysAgo(7), NOW)).toBe('committee')
  })

  it('returns stored "passed_chamber" even if introduced 2 days ago (advanced status wins)', () => {
    expect(deriveDisplayStatus('passed_chamber', daysAgo(2), NOW)).toBe('passed_chamber')
  })

  it('returns stored "signed" even if introduced 1 day ago (advanced status wins)', () => {
    expect(deriveDisplayStatus('signed', daysAgo(1), NOW)).toBe('signed')
  })

  it('returns stored status for malformed introduced date (defensive fallback)', () => {
    expect(deriveDisplayStatus('committee', 'not-a-date', NOW)).toBe('committee')
  })

  it('legacy: stored "introduced" + 3 days old still displays as "introduced"', () => {
    // Pre-refactor data may have status='introduced' in the bills table.
    // Within the 7-day window, the time-based override agrees with the
    // legacy stored value.
    expect(deriveDisplayStatus('introduced', daysAgo(3), NOW)).toBe('introduced')
  })

  it('legacy: stored "introduced" + 10 days old rolls forward to "committee"', () => {
    // Past the window, legacy 'introduced' rows display as 'committee'
    // — the time-based override is what reconciles them.
    expect(deriveDisplayStatus('introduced', daysAgo(10), NOW)).toBe('committee')
  })
})
