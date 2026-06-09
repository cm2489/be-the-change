import { deriveDisplayStatus, type BillStatus } from '../congress'

// Urgency bands group the (already urgency-sorted) flat feed into stages, with a
// header before each. NOT category sections — the feed stays one urgency-sorted
// list. Pure + unit-tested.
//
// (Relative import of congress, not the spec's `@/lib/congress`: vitest doesn't
// resolve the `@/` alias, and the existing tested lib modules import relatively.)

export type UrgencyBand = 'imminent' | 'coming' | 'committee' | 'resolved'

export const BAND_ORDER: UrgencyBand[] = ['imminent', 'coming', 'committee', 'resolved']

export const BAND_META: Record<UrgencyBand, { label: string; note: string }> = {
  imminent: { label: 'Vote imminent', note: 'Calls matter most now' },
  coming: { label: 'Coming up', note: 'Moving through Congress' },
  committee: { label: 'In committee', note: 'Earlier stage' },
  resolved: { label: 'Signed or closed', note: 'No longer active' },
}

// Derive the band from the SAME display status the card shows, so band and card
// never disagree.
export function bandOf(status: BillStatus, introducedDate: string): UrgencyBand {
  const s = deriveDisplayStatus(status, introducedDate)
  if (s === 'floor_vote') return 'imminent'
  if (s === 'passed_chamber' || s === 'conference' || s === 'markup') return 'coming'
  if (s === 'committee' || s === 'introduced') return 'committee'
  return 'resolved' // signed, vetoed
}

export type BandGroup<T> = { band: UrgencyBand; bills: T[] }

// Bucket an urgency-sorted bill list into bands, in BAND_ORDER, dropping empty
// bands and preserving each bill's relative order within its band. Generic so it
// stays decoupled from the FeedBill component type.
export function groupByBand<T extends { status: string; introduced_date: string }>(
  bills: T[],
): Array<BandGroup<T>> {
  const buckets = new Map<UrgencyBand, T[]>()
  for (const bill of bills) {
    const band = bandOf(bill.status as BillStatus, bill.introduced_date)
    const existing = buckets.get(band)
    if (existing) existing.push(bill)
    else buckets.set(band, [bill])
  }
  return BAND_ORDER.filter((band) => buckets.has(band)).map((band) => ({
    band,
    bills: buckets.get(band)!,
  }))
}
