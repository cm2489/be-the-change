import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { generateScript } from '@/lib/anthropic'

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

  const {
    billId,
    representativeId,
    representativeName,
    representativeTitle,
    billTitle,
    billSummary,
    scriptType = 'phone',
    stance = 'concerned',
  } = body

  if (!billTitle || !representativeName) {
    return NextResponse.json(
      { error: 'billTitle and representativeName are required' },
      { status: 400 }
    )
  }

  const adminClient = createAdminClient()

  // Check for a cached script for this exact combination
  if (billId && representativeId) {
    const { data: cached } = await adminClient
      .from('scripts')
      .select('*')
      .eq('user_id', userId)
      .eq('bill_id', billId)
      .eq('representative_id', representativeId)
      .eq('script_type', scriptType)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (cached) {
      return NextResponse.json({ script: cached, cached: true })
    }
  }

  // Load user's name and interests
  const { data: profile } = await adminClient
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single()

  const { data: interests } = await adminClient
    .from('user_interests')
    .select('category, subcategory')
    .eq('user_id', userId)
    .order('rank')
    .limit(5)

  const userName = profile?.full_name || session.user.email?.split('@')[0] || 'A constituent'
  const userInterests = (interests ?? []).map(i => i.subcategory || i.category)

  // Generate with Claude
  const { content, wordCount } = await generateScript({
    billTitle,
    billSummary: billSummary || '',
    repName: representativeName,
    repTitle: representativeTitle || '',
    userName,
    userInterests,
    scriptType,
    stance,
  })

  // Save to database
  const { data: saved } = await adminClient
    .from('scripts')
    .insert({
      user_id: userId,
      bill_id: billId || null,
      representative_id: representativeId || null,
      script_type: scriptType,
      content,
      word_count: wordCount,
    })
    .select()
    .single()

  return NextResponse.json({ script: saved ?? { content, word_count: wordCount }, cached: false })
}
