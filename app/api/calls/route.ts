import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'

// NOTE: This route is currently broken against the schema — it writes to
// `call_logs` with columns that were removed in migration 002. Feature 5
// (1-Click Calling) will rewrite it to use `call_events` per SCHEMA.md.
// The freemium gating was removed on 2026-04-24 per FEATURES.md scope.
// See docs/deferred.md#schema-drift-call-logs-and-freemium.

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const body = await request.json()
  const { action, callLogId, billId, representativeId, scriptId, scriptType } = body

  if (action === 'initiate') {
    const adminClient = createAdminClient()
    const { data: log, error } = await adminClient
      .from('call_logs')
      .insert({
        user_id: userId,
        bill_id: billId || null,
        representative_id: representativeId || null,
        script_id: scriptId || null,
        script_type: scriptType || 'phone',
        status: 'pending',
        call_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create call log' }, { status: 500 })
    }

    return NextResponse.json({ callLogId: log.id })
  }

  if (action === 'complete') {
    if (!callLogId) {
      return NextResponse.json({ error: 'callLogId required' }, { status: 400 })
    }

    const { status } = body
    if (!['completed', 'skipped', 'abandoned'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    await adminClient
      .from('call_logs')
      .update({
        status,
        completed_at: new Date().toISOString(),
      })
      .eq('id', callLogId)
      .eq('user_id', userId)

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
