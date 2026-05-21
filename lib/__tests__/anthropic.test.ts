import { describe, it, expect, vi, afterEach } from 'vitest'
import { computeCostUsd } from '../anthropic'

describe('computeCostUsd', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('charges Haiku 4.5 at $1/M input + $5/M output', () => {
    // 1,000,000 input × $1/M = $1.00; 1,000,000 output × $5/M = $5.00 → $6.00
    expect(computeCostUsd('claude-haiku-4-5', 1_000_000, 1_000_000)).toBe(6)
  })

  it('handles the dated model alias the same as the rolling alias', () => {
    expect(computeCostUsd('claude-haiku-4-5-20251001', 1_000_000, 1_000_000)).toBe(6)
  })

  it('returns 0 for zero-token calls', () => {
    expect(computeCostUsd('claude-haiku-4-5', 0, 0)).toBe(0)
  })

  it('returns a typical per-script cost in the sub-cent range', () => {
    // Realistic shape: ~500 input + ~150 output. Should round to
    // 500/1M * $1 + 150/1M * $5 = $0.000500 + $0.000750 = $0.00125.
    expect(computeCostUsd('claude-haiku-4-5', 500, 150)).toBe(0.00125)
  })

  it('rounds to 6 decimal places to match numeric(10,6)', () => {
    // 1 input + 1 output = 1/1M + 5/1M = 0.000006, exactly at column precision.
    expect(computeCostUsd('claude-haiku-4-5', 1, 1)).toBe(0.000006)
  })

  it('logs a warning and returns 0 for an unknown model — does not throw', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const cost = computeCostUsd('not-a-real-model', 1_000_000, 1_000_000)
    expect(cost).toBe(0)
    expect(warn).toHaveBeenCalledOnce()
  })
})
