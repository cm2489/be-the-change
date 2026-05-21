// Orchestrates the Congress.gov → Supabase ingestion pipeline shared
// by the nightly cron and the admin diagnostic route.
//
// Flow:
//   1. Resolve `fromDateTime` from sync_state (caller supplies it).
//   2. fetchRecentBills → list endpoint, paginated.
//   3. Filter to MVP bill types up front so we don't burn detail-fetch
//      quota on rows we'd discard anyway.
//   4. Concurrency-limited per-bill pipeline:
//        - fetchBillDetail
//        - mapDetailToBill (returns null = skip, not fail)
//        - upsertBillWithActionLog (append bill_actions row only when
//          an existing bill's last_action_text changed)
//   5. Bucket outcomes into success / partial / failed using the 80%
//      detail-fetch success threshold the Phase 3a spec defines.
//
// `runBillSync` is intentionally side-effect-free with respect to
// `sync_state` — the caller decides whether to advance the high-water-
// mark based on the returned status. The cron does; the admin route
// doesn't.

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  fetchRecentBills,
  fetchBillDetail,
  mapDetailToBill,
  normalizeBillType,
  type CanonicalBill,
} from './congress'

export interface BillSyncSummary {
  synced: number
  skipped: number
  action_log_appended: number
  status: 'success' | 'partial' | 'failed'
  error?: string
}

export interface BillSyncOptions {
  fromDateTime: string
  // Hard cap on the number of bills processed in a single run. The
  // cron leaves this undefined (process everything in the window);
  // the admin route uses it as a diagnostic knob.
  cap?: number
  // Detail-fetch concurrency. Defaults to 8 — high enough to keep
  // the 60s Vercel ceiling comfortable for a few-hundred-bill window,
  // low enough not to trip Congress.gov's 5,000/hour rate limit
  // (8 concurrent × ~3 req/s × 60s = ~1,440/run, well under budget).
  concurrency?: number
}

const DEFAULT_CONCURRENCY = 8
const PARTIAL_SUCCESS_THRESHOLD = 0.8

export async function runBillSync(
  supabase: SupabaseClient,
  opts: BillSyncOptions,
): Promise<BillSyncSummary> {
  let listItems
  try {
    listItems = await fetchRecentBills(opts.fromDateTime)
  } catch (err) {
    return {
      synced: 0,
      skipped: 0,
      action_log_appended: 0,
      status: 'failed',
      error: err instanceof Error ? err.message : String(err),
    }
  }

  const filtered = listItems.filter(
    item => normalizeBillType(item.type) !== null,
  )
  const work = opts.cap ? filtered.slice(0, opts.cap) : filtered

  if (work.length === 0) {
    return {
      synced: 0,
      skipped: 0,
      action_log_appended: 0,
      status: 'success',
    }
  }

  let synced = 0
  let skipped = 0
  let actionAppended = 0
  let failed = 0

  await withConcurrency(
    work,
    opts.concurrency ?? DEFAULT_CONCURRENCY,
    async item => {
      const billNumber = Number(item.number)
      if (!Number.isFinite(billNumber)) {
        skipped++
        return
      }

      let detail
      try {
        detail = await fetchBillDetail(item.congress, item.type, billNumber)
      } catch (err) {
        console.warn(
          `[bill-sync] detail fetch failed for ${item.type}-${item.number}-${item.congress}:`,
          err instanceof Error ? err.message : err,
        )
        failed++
        return
      }

      const canonical = mapDetailToBill(detail)
      if (!canonical) {
        // mapDetailToBill returned null — missing required field or
        // non-MVP bill type. Counts as skipped, not failed: the data
        // is incomplete on Congress.gov's side, not on ours.
        skipped++
        return
      }

      // Substance filter: skip bills still at 'introduced'. These are
      // mostly bookkeeping noise — sponsor swaps, introductory remarks,
      // bills that will never move. The feed should surface bills
      // committee-stage or later, where there's something to act on.
      // See docs/deferred.md#substance-filter-introduced-bills for the
      // v1.1 work to surface introduced-status bills selectively
      // (cosponsor count, sponsor role, AI substance classifier, etc.).
      if (canonical.status === 'introduced') {
        skipped++
        return
      }

      try {
        const appended = await upsertBillWithActionLog(supabase, canonical)
        synced++
        if (appended) actionAppended++
      } catch (err) {
        console.warn(
          `[bill-sync] upsert failed for ${canonical.full_identifier}:`,
          err instanceof Error ? err.message : err,
        )
        failed++
      }
    },
  )

  const total = synced + failed
  if (total === 0) {
    return {
      synced,
      skipped,
      action_log_appended: actionAppended,
      status: 'failed',
      error: 'No bills processed; all detail fetches failed.',
    }
  }
  if (failed === 0) {
    return {
      synced,
      skipped,
      action_log_appended: actionAppended,
      status: 'success',
    }
  }
  if (synced / total >= PARTIAL_SUCCESS_THRESHOLD) {
    return {
      synced,
      skipped,
      action_log_appended: actionAppended,
      status: 'partial',
      error: `${failed} of ${total} bills failed during detail fetch or upsert`,
    }
  }
  return {
    synced,
    skipped,
    action_log_appended: actionAppended,
    status: 'failed',
    error: `${failed} of ${total} bills failed (below ${Math.round(PARTIAL_SUCCESS_THRESHOLD * 100)}% success threshold)`,
  }
}

// Returns true when an existing bill row's last_action_text changed
// and a bill_actions row was appended. Returns false on the new-insert
// path: a freshly-created bill is itself the implicit first action
// record, no separate action log row needed.
//
// bill_actions failures are logged but NOT propagated — the bill
// upsert is the canonical write, the audit log is best-effort. A
// missed action row will be re-detected on the next cron run if the
// bill stays at the new status, since we compare last_action_text on
// every upsert.
async function upsertBillWithActionLog(
  supabase: SupabaseClient,
  bill: CanonicalBill,
): Promise<boolean> {
  const { data: existing, error: selErr } = await supabase
    .from('bills')
    .select('id, last_action_text')
    .eq('full_identifier', bill.full_identifier)
    .maybeSingle()
  if (selErr) throw selErr

  const actionChanged =
    existing != null && existing.last_action_text !== bill.last_action_text

  const { data: upserted, error: upErr } = await supabase
    .from('bills')
    .upsert(
      { ...bill, last_synced_at: new Date().toISOString() },
      { onConflict: 'full_identifier' },
    )
    .select('id')
    .single()
  if (upErr) throw upErr

  if (!actionChanged || !upserted?.id) return false

  const { error: actErr } = await supabase.from('bill_actions').insert({
    bill_id: upserted.id,
    action_date: bill.last_action_date,
    action_text: bill.last_action_text,
    // action_type reuses the canonical status token. Gives downstream
    // consumers (Feature 6 push notifications) a stable enum to filter
    // on without re-parsing action_text.
    action_type: bill.status,
  })
  if (actErr) {
    console.warn(
      `[bill-sync] failed to append bill_actions row for ${bill.full_identifier}:`,
      actErr.message,
    )
    return false
  }
  return true
}

// Hand-rolled concurrency limiter. We avoid p-limit per CLAUDE.md's
// "no new dependencies without permission" rule, and the implementation
// is small enough that its complexity isn't worth a dependency.
//
// Workers pull from a shared index until the queue is exhausted.
// Errors are swallowed — accounting is the caller's responsibility via
// closures, since each worker's outcome needs to be classified into
// synced/skipped/failed.
async function withConcurrency<T>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let idx = 0
  const workerCount = Math.min(concurrency, items.length)
  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const i = idx++
      if (i >= items.length) return
      try {
        await fn(items[i])
      } catch {
        // see comment above
      }
    }
  })
  await Promise.all(workers)
}

// Computes the high-water-mark for the next list fetch.
//
// First run (lastSuccessAt null): use a fixed initial lookback. We
// don't backfill all of history from the cron — that's a one-shot
// script tracked in docs/deferred.md#feature-3-backfill-119th-congress.
// 1 day chosen over 7 to fit comfortably under the 60s Vercel ceiling
// — a 7-day initial window pulled ~1,350 bills in the first live run,
// taking 83 seconds (over the cap). Nightly incremental runs use the
// 48h overlap, which is a smaller delta from any prior sync.
//
// Subsequent runs: subtract a 48-hour overlap window from the prior
// success timestamp. The overlap absorbs Congress.gov's update-time
// jitter and any in-flight updates during the prior sync. Idempotent
// upserts make the redundant fetches harmless.
export function computeFromDateTime(
  lastSuccessAt: string | null,
  initialLookbackDays = 1,
  overlapHours = 48,
): string {
  const target = !lastSuccessAt
    ? new Date(Date.now() - initialLookbackDays * 86_400_000)
    : new Date(
        new Date(lastSuccessAt).getTime() - overlapHours * 3_600_000,
      )
  return toCongressDateTime(target)
}

// Congress.gov's /bill?fromDateTime=... endpoint accepts only the
// strict `%Y-%m-%dT%H:%M:%SZ` format — Date#toISOString's millisecond
// component (`.755`) trips a 400 Bad Request. Strip the fractional
// seconds and keep the trailing Z.
//
// Exported for the admin route, which needs to apply the same
// normalization to the user-supplied ?since override.
export function toCongressDateTime(date: Date): string {
  return date.toISOString().replace(/\.\d+Z$/, 'Z')
}

// sync_state singleton helpers. The table has a UNIQUE INDEX on the
// constant expression `(1)` (see migration 006), so at most one row
// ever exists. Read returns null on first-ever run; write inserts on
// first run, updates thereafter.

export async function readSyncState(
  supabase: SupabaseClient,
): Promise<{ id: string; last_successful_sync_at: string | null } | null> {
  const { data, error } = await supabase
    .from('sync_state')
    .select('id, last_successful_sync_at')
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ?? null
}

export interface SyncStateWrite {
  // ISO timestamp to advance last_successful_sync_at to, OR null to
  // explicitly NOT advance (used on total-failure runs so the next
  // sync re-pulls the same window).
  advanceSuccessTo: string | null
  last_sync_status: 'success' | 'partial' | 'failed'
  last_sync_error: string | null
}

export async function writeSyncState(
  supabase: SupabaseClient,
  patch: SyncStateWrite,
): Promise<void> {
  const existing = await readSyncState(supabase)
  const now = new Date().toISOString()
  const baseRow = {
    last_sync_status: patch.last_sync_status,
    last_sync_error: patch.last_sync_error,
    updated_at: now,
  }

  if (existing) {
    const updateRow =
      patch.advanceSuccessTo !== null
        ? { ...baseRow, last_successful_sync_at: patch.advanceSuccessTo }
        : baseRow
    const { error } = await supabase
      .from('sync_state')
      .update(updateRow)
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('sync_state').insert({
      ...baseRow,
      last_successful_sync_at: patch.advanceSuccessTo,
    })
    if (error) throw error
  }
}
