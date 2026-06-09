import { describe, it, expect } from 'vitest'
import { bandOf, groupByBand, BAND_ORDER } from '../feed/urgencyBands'

const today = new Date().toISOString().slice(0, 10)
const old = '2020-01-01' // well past the recently-introduced window

describe('bandOf', () => {
  it('floor_vote → imminent', () => {
    expect(bandOf('floor_vote', old)).toBe('imminent')
  })
  it('passed_chamber / conference / markup → coming', () => {
    expect(bandOf('passed_chamber', old)).toBe('coming')
    expect(bandOf('conference', old)).toBe('coming')
    expect(bandOf('markup', old)).toBe('coming')
  })
  it('committee, and introduced (recent or aged) → committee', () => {
    expect(bandOf('committee', old)).toBe('committee')
    expect(bandOf('introduced', today)).toBe('committee') // recent → stays introduced → committee band
    expect(bandOf('introduced', old)).toBe('committee') // aged → derives to committee → committee band
  })
  it('signed / vetoed → resolved', () => {
    expect(bandOf('signed', old)).toBe('resolved')
    expect(bandOf('vetoed', old)).toBe('resolved')
  })
})

describe('groupByBand', () => {
  const b = (id: string, status: string, introduced_date = old) => ({ id, status, introduced_date })

  it('returns bands in BAND_ORDER and drops empty bands', () => {
    const groups = groupByBand([b('a', 'committee'), b('b', 'floor_vote'), b('c', 'signed')])
    expect(groups.map((g) => g.band)).toEqual(['imminent', 'committee', 'resolved']) // 'coming' dropped, order canonical
  })

  it('preserves input order within a band (the feed is pre-sorted by urgency)', () => {
    const groups = groupByBand([b('first', 'committee'), b('second', 'committee')])
    expect(groups[0].bills.map((x) => x.id)).toEqual(['first', 'second'])
  })

  it('handles an empty feed', () => {
    expect(groupByBand([])).toEqual([])
  })

  it('BAND_ORDER is the canonical four', () => {
    expect(BAND_ORDER).toEqual(['imminent', 'coming', 'committee', 'resolved'])
  })
})
