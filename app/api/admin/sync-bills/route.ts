// Diagnostic admin sync route. Mirrors the cron's ingestion path but
// (a) authenticates via the existing logged-in-user pattern instead of
// CRON_SECRET, (b) accepts ?since=<ISO> to override fromDateTime, (c)
// accepts ?max=<int> (default 50, hard cap 500) to bound per-call
// work, and (d) never writes to sync_state — admin runs are
// diagnostic, not the primary high-water-mark.
//
// Same BillSyncSummary JSON response shape as /api/cron/sync-bills so
// callers can parse one schema either way.

import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import {
  runBillSync,
  readSyncState,
  computeFromDateTime,
  toCongressDateTime,
} from '@/lib/bill-sync'

export const maxDuration = 60

const DEFAULT_MAX = 50
const HARD_CAP_MAX = 500

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)

  // ?since=<ISO>: explicit fromDateTime override. Falls back to the
  // same computeFromDateTime() the cron uses (sync_state-driven), so
  // an admin without a since param gets the same window the cron
  // would. Bad ISO strings yield 400 — not a "what window did this
  // run cover?" mystery in the response.
  const sinceParam = url.searchParams.get('since')
  let fromDateTime: string
  if (sinceParam) {
    const parsed = new Date(sinceParam)
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json(
        { error: `Invalid ?since value: "${sinceParam}". Expected ISO 8601.` },
        { status: 400 },
      )
    }
    fromDateTime = toCongressDateTime(parsed)
  } else {
    const admin = createAdminClient()
    const state = await readSyncState(admin).catch(() => null)
    fromDateTime = computeFromDateTime(state?.last_successful_sync_at ?? null)
  }

  // ?max=<int>: bound per-call work. Default 50 (cheap diagnostic),
  // hard cap 500 to prevent a typoed query param from queueing a
  // multi-thousand-bill run that would blow the 60s ceiling.
  const maxParam = url.searchParams.get('max')
  let cap = DEFAULT_MAX
  if (maxParam !== null) {
    const parsed = Number(maxParam)
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return NextResponse.json(
        { error: `Invalid ?max value: "${maxParam}". Expected positive integer.` },
        { status: 400 },
      )
    }
    cap = Math.min(parsed, HARD_CAP_MAX)
  }

  const admin = createAdminClient()
  const summary = await runBillSync(admin, { fromDateTime, cap })

  return NextResponse.json({
    synced: summary.synced,
    skipped: summary.skipped,
    action_log_appended: summary.action_log_appended,
    status: summary.status,
    ...(summary.error ? { error: summary.error } : {}),
    // Echo the inputs so the caller can correlate response with run
    // window without inferring from server logs.
    fromDateTime,
    cap,
  })
}
