import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Returns null during server-side build when env vars are absent
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null as any
  return createClientComponentClient()
}
