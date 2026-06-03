import { describe, it, expect } from 'vitest'
import { resolveRelevance, type Relevance } from '../relevance'

// Regression coverage for the bill-detail relevance match. Post CRS re-anchor,
// `issue_tags` carries flat CATEGORY ids (one per bill, mapped 1:1 from the
// bill's CRS Policy Area — see lib/bill-tagger.ts). The matcher is a RAW
// intersection of the user's selected category ids against the bill's tags,
// iterated over the canonical taxonomy so output is order-stable and deduped.
//
// Each case logs `state` + the matched category LABELS so the actual output is
// visible in the run, not just pass/fail.

const labels = (r: Relevance) => r.matchedCategories.map(c => c.label)

function show(name: string, r: Relevance) {
  // eslint-disable-next-line no-console
  console.log(`  ${name.padEnd(28)} state=${r.state.padEnd(10)} matched=[${labels(r).join(', ')}]`)
}

describe('resolveRelevance', () => {
  it('populated — multi-category match (order-stable by taxonomy order, deduped)', () => {
    const r = resolveRelevance(
      ['government_democracy', 'jobs_economy'],
      ['jobs_economy', 'government_democracy'],
    )
    show('populated (multi)', r)
    expect(r.state).toBe('populated')
    // Output order follows INTEREST_CATEGORIES order, not input order:
    // jobs_economy (#1) precedes government_democracy (#6).
    expect(labels(r)).toEqual(['Jobs & the Economy', 'Government & Democracy'])
  })

  it('populated — single-category match', () => {
    const r = resolveRelevance(['health'], ['health'])
    show('populated (single)', r)
    expect(r.state).toBe('populated')
    expect(labels(r)).toEqual(['Health & Healthcare'])
  })

  it('empty — user has set no interests', () => {
    const r = resolveRelevance([], ['health'])
    show('empty', r)
    expect(r.state).toBe('empty')
    expect(labels(r)).toEqual([])
  })

  it('no_match — interests set, none intersect the bill', () => {
    const r = resolveRelevance(['health'], ['jobs_economy'])
    show('no_match', r)
    expect(r.state).toBe('no_match')
    expect(labels(r)).toEqual([])
  })

  it('no double-counting — a duplicate tag collapses to one match', () => {
    const r = resolveRelevance(['health'], ['health', 'health'])
    show('double-count guard', r)
    expect(r.state).toBe('populated')
    expect(labels(r)).toEqual(['Health & Healthcare'])
    expect(r.matchedCategories).toHaveLength(1)
  })

  it('unknown / garbage tags are ignored', () => {
    const r = resolveRelevance(['health'], ['health', '__not_a_real_id__'])
    show('unknown tag ignored', r)
    expect(r.state).toBe('populated')
    expect(labels(r)).toEqual(['Health & Healthcare'])
  })

  it('no_match — null issue_tags (freshly-synced bill, not yet tagged)', () => {
    const r = resolveRelevance(['health'], null)
    show('null issue_tags', r)
    expect(r.state).toBe('no_match')
    expect(labels(r)).toEqual([])
  })
})
