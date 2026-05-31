import { describe, it, expect } from 'vitest'
import { resolveRelevance, type Relevance } from '../relevance'

// Regression coverage for the bill-detail relevance match. The class of bug
// this guards against (STRATEGY.md, 2026-04-28): the tagger once emitted
// subcategory ids WITHOUT their parents, so the category-level intersection
// silently matched nothing. The fix lives in the tagger (it now emits parents
// too); the matcher stays a RAW parent-id intersection and must NOT walk
// subcategory -> parent (the rejected alternative). These cases lock both the
// happy path and the deliberate "bare subcategory does not match" behavior.
//
// Each case logs `state` + the matched category LABELS so the actual output is
// visible in the run, not just pass/fail.

const labels = (r: Relevance) => r.matchedCategories.map(c => c.label)

function show(name: string, r: Relevance) {
  // eslint-disable-next-line no-console
  console.log(`  ${name.padEnd(28)} state=${r.state.padEnd(10)} matched=[${labels(r).join(', ')}]`)
}

describe('resolveRelevance', () => {
  it('populated — multi-category match, parents present (order-stable, deduped)', () => {
    const r = resolveRelevance(
      ['economy', 'democracy'],
      ['economy', 'econ_housing', 'democracy', 'dem_voting'],
    )
    show('populated (multi)', r)
    expect(r.state).toBe('populated')
    expect(labels(r)).toEqual(['Democracy & Voting', 'Economy & Labor'])
  })

  it('populated — subcategory-tagged bill matches BECAUSE the tagger emits the parent', () => {
    // The tagger's contract: a bill tagged `econ_housing` also carries `economy`.
    const r = resolveRelevance(['economy'], ['economy', 'econ_housing'])
    show('populated (sub+parent)', r)
    expect(r.state).toBe('populated')
    expect(labels(r)).toEqual(['Economy & Labor'])
  })

  it('empty — user has set no interests', () => {
    const r = resolveRelevance([], ['economy', 'econ_housing'])
    show('empty', r)
    expect(r.state).toBe('empty')
    expect(labels(r)).toEqual([])
  })

  it('no_match — interests set, none intersect the bill', () => {
    const r = resolveRelevance(['healthcare'], ['economy', 'econ_housing'])
    show('no_match', r)
    expect(r.state).toBe('no_match')
    expect(labels(r)).toEqual([])
  })

  it('no_match — BARE subcategory without its parent does NOT match (intended; parent-only by design)', () => {
    // Malformed per the tagger contract (parent `economy` is missing). The
    // matcher correctly does not walk sub -> parent, so this does not match.
    const r = resolveRelevance(['economy'], ['econ_housing'])
    show('bare-subcategory', r)
    expect(r.state).toBe('no_match')
    expect(labels(r)).toEqual([])
  })

  it('no double-counting — parent + its subcategory + a duplicate parent collapse to one', () => {
    const r = resolveRelevance(['economy'], ['economy', 'econ_housing', 'economy'])
    show('double-count guard', r)
    expect(r.state).toBe('populated')
    expect(labels(r)).toEqual(['Economy & Labor'])
    expect(r.matchedCategories).toHaveLength(1)
  })

  it('unknown / garbage tags are ignored', () => {
    const r = resolveRelevance(['economy'], ['economy', '__not_a_real_id__'])
    show('unknown tag ignored', r)
    expect(r.state).toBe('populated')
    expect(labels(r)).toEqual(['Economy & Labor'])
  })

  it('no_match — null issue_tags (freshly-synced bill)', () => {
    const r = resolveRelevance(['economy'], null)
    show('null issue_tags', r)
    expect(r.state).toBe('no_match')
    expect(labels(r)).toEqual([])
  })
})
