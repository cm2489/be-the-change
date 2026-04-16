import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { getDailyCallCount } from '@/lib/freemium'

// POST — initiate or update a call log
export async function POST(request: Request) {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const body = await request.json()
  const { action, callLogId, billId, representativeId, scriptId, scriptType } = body

  // ACTION: initiate — check limit and create a call log
  if (action === 'initiate') {
    const callCount = await getDailyCallCount(userId)

    if (!callCount.canCall) {
      return NextResponse.json(
        {
          error: 'DAILY_LIMIT_REACHED',
          used: callCount.used,
          limit: callCount.limit,
          upgradeUrl: '/upgrade',
        },
        { status: 429 }
      )
    }

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

    return NextResponse.json({
      callLogId: log.id,
      callCount: callCount,
    })
  }

  // ACTION: complete — update call status
  if (action === 'complete') {
    if (!callLogId) {
      return NextResponse.json({ error: 'callLogId required' }, { status: 400 })
    }

    const { status } = body // 'completed' | 'skipped' | 'abandoned'
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

    const updatedCount = await getDailyCallCount(userId)
    return NextResponse.json({ success: true, callCount: updatedCount })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

// GET — return today's call count
export async function GET() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const callCount = await getDailyCallCount(session.user.id)
  return NextResponse.json(callCount)
}
