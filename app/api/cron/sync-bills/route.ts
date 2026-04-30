// Nightly Congress.gov → Supabase bill sync. Triggered by Vercel Cron
// with CRON_SECRET in one of: x-cron-secret header, ?secret query
// param, or Authorization: Bearer.
//
// All ingestion logic lives in lib/bill-sync.ts so the admin diagnostic
// route can share it. This handler is the cron-specific orchestration:
// secret check → resolve fromDateTime from sync_state → run sync →
// write sync_state → return summary.

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  runBillSync,
  readSyncState,
  writeSyncState,
  computeFromDateTime,
} from '@/lib/bill-sync'

// Vercel cron hard ceiling. The detail-fetch concurrency in
// lib/bill-sync.ts is sized so that a worst-case ~few-hundred-bill
// window fits comfortably under this limit. If the cron starts
// timing out, lower the lookback window (computeFromDateTime) before
// raising concurrency further — Congress.gov rate limits will bite
// before throughput does.
export const maxDuration = 60

function validateSecret(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  const headerSecret = request.headers.get('x-cron-secret')
  const urlSecret = new URL(request.url).searchParams.get('secret')
  const authHeader = request.headers.get('authorization')
  const bearerSecret = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null
  return [headerSecret, urlSecret, bearerSecret].some(s => s === cronSecret)
}

async function handle(request: Request): Promise<NextResponse> {
  if (!validateSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // sync_state read failures are non-fatal — fall back to first-run
  // lookback so a transient DB blip doesn't prevent a sync. The write
  // at the end of the run will repair the table state.
  let priorSuccessAt: string | null = null
  try {
    const state = await readSyncState(supabase)
    priorSuccessAt = state?.last_successful_sync_at ?? null
  } catch (err) {
    console.error('[cron/sync-bills] readSyncState failed:', err)
  }

  const fromDateTime = computeFromDateTime(priorSuccessAt)
  const summary = await runBillSync(supabase, { fromDateTime })

  // sync_state advance semantics:
  //   success → advance last_successful_sync_at to now
  //   partial → advance (we accept partial loss to avoid stalling on a
  //             persistently-flaky bill that would block all forward
  //             progress)
  //   failed  → do NOT advance — next run re-pulls the same window
  const advanceSuccessTo =
    summary.status === 'failed' ? null : new Date().toISOString()

  try {
    await writeSyncState(supabase, {
      advanceSuccessTo,
      last_sync_status: summary.status,
      last_sync_error: summary.error ?? null,
    })
  } catch (err) {
    console.error('[cron/sync-bills] writeSyncState failed:', err)
  }

  return NextResponse.json({
    synced: summary.synced,
    skipped: summary.skipped,
    action_log_appended: summary.action_log_appended,
    status: summary.status,
    ...(summary.error ? { error: summary.error } : {}),
  })
}

export const GET = handle
export const POST = handle
