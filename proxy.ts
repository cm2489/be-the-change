import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes that don't require auth
const PUBLIC_ROUTES = ['/', '/login', '/signup']
const API_PUBLIC = ['/api/cron'] // cron uses its own secret

export async function proxy(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const path = req.nextUrl.pathname

  // Allow public routes and public API routes
  if (
    PUBLIC_ROUTES.includes(path) ||
    API_PUBLIC.some(p => path.startsWith(p)) ||
    path.startsWith('/_next') ||
    path.startsWith('/icons') ||
    path === '/sw.js' ||
    path === '/manifest.json'
  ) {
    return res
  }

  // Redirect unauthenticated users to login
  if (!session && !path.startsWith('/api')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Redirect unauthenticated API requests
  if (!session && path.startsWith('/api')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
