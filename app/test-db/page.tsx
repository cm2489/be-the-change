'use client'

import { useEffect, useState } from 'react'

export default function TestDB() {
  const [status, setStatus] = useState('Checking...')

  useEffect(() => {
    // Check if environment variables are loaded
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      setStatus('❌ Missing environment variables')
      return
    }

    if (url.includes('supabase.co')) {
      setStatus('✅ Supabase configured!')
    } else {
      setStatus('⚠️ Invalid Supabase URL')
    }
  }, [])

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Database Connection Test</h1>
      <p style={{ fontSize: '24px', marginTop: '20px' }}>{status}</p>
      <div style={{ marginTop: '40px', textAlign: 'left', maxWidth: '600px', margin: '40px auto' }}>
        <h3>Checklist:</h3>
        <p>✓ Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
        <p>✓ Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
      </div>
    </div>
  )
}