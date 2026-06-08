import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

// cn() wraps tailwind-merge, extended so the project's custom fontSize tokens
// (text-small, text-control, text-h3, ...) are recognized as font sizes. Without
// that registration, a size override emits both classes instead of resolving, so
// the Button's `lg`/`sm` size variants would not reliably override the base size.
// These guard that behavior.
describe('cn', () => {
  it('resolves a custom font-size override to the last token (button lg over base)', () => {
    // Button base sets text-control; the lg size sets text-small — last must win.
    expect(cn('text-control text-small')).toBe('text-small')
  })

  it('keeps a text color alongside a custom font-size token (no dropped color)', () => {
    const result = cn('text-paper text-control')
    expect(result).toContain('text-paper')
    expect(result).toContain('text-control')
  })

  it('still merges standard conflicting utilities', () => {
    expect(cn('px-2 px-4')).toBe('px-4')
    expect(cn('rounded-md', 'rounded-xl')).toBe('rounded-xl')
  })
})
