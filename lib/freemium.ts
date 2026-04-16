import { createAdminClient } from '@/lib/supabase/server'

const FREE_TIER_DAILY_LIMIT = 5

export interface CallCountResult {
  used: number
  limit: number
  remaining: number
  isPremium: boolean
  canCall: boolean
}

export async function getDailyCallCount(userId: string): Promise<CallCountResult> {
  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .single()

  const isPremium = profile?.subscription_tier === 'premium'

  if (isPremium) {
    return {
      used: 0,
      limit: Infinity,
      remaining: Infinity,
      isPremium: true,
      canCall: true,
    }
  }

  // Count calls today (UTC date)
  const today = new Date().toISOString().split('T')[0]

  const { count } = await supabase
    .from('call_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('call_date', today)
    .in('status', ['completed', 'skipped'])

  const used = count ?? 0
  const remaining = Math.max(0, FREE_TIER_DAILY_LIMIT - used)

  return {
    used,
    limit: FREE_TIER_DAILY_LIMIT,
    remaining,
    isPremium: false,
    canCall: used < FREE_TIER_DAILY_LIMIT,
  }
}
