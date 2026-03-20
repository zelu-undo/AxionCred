import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/alerts',
  '/super-admin',
  '/demo',
]

// Routes that should bypass all middleware checks
const bypassRoutes = [
  '/_next',
  '/api',
  '/favicon.ico',
  '/logo-axion.png',
]

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl
  
  // Skip RSC requests - these are internal Next.js requests
  const isRSC = searchParams.get('_rsc')
  if (isRSC) {
    return NextResponse.next()
  }

  // Skip static files and other assets
  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname.startsWith('/public') ||
    pathname.includes('.') // files with extensions
  ) {
    return NextResponse.next()
  }

  // Skip bypass routes
  if (bypassRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check if this is a public route
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )

  // If public route, just continue
  if (isPublicRoute) {
    // Não fazer verificação de sessão no server para login/register
    // O client-side já faz essa verificação
    return NextResponse.next()
  }

  // Create response for cookie handling
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // Check for Supabase auth tokens in cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get session - retry once if first attempt fails due to network issues
  let session = null
  let sessionError = null
  
  try {
    const { data: { session: s }, error } = await supabase.auth.getSession()
    session = s
    sessionError = error
  } catch (err) {
    console.error('[Middleware] Session check error:', err)
    // Give it one more try after a brief delay
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      const { data: { session: s }, error } = await supabase.auth.getSession()
      session = s
      sessionError = error
    } catch (retryErr) {
      console.error('[Middleware] Session retry error:', retryErr)
    }
  }

  // If there's an error or no session
  if (sessionError || !session) {
    // Don't redirect immediately - let the client handle the redirect
    // This prevents race conditions where the session hasn't loaded yet
    // Instead, allow the request to continue and let the client-side auth check handle it
    console.log('[Middleware] No session found, allowing client-side redirect')
    
    // Still return the response to let the app render
    // The client-side AuthProvider will handle the redirect
    return response
  }

  // Check if session is about to expire (within 5 minutes) and refresh if needed
  if (session.expires_at) {
    const expiresAt = session.expires_at * 1000 // Convert to milliseconds
    const now = Date.now()
    const timeUntilExpiry = expiresAt - now
    
    // If session expires in less than 5 minutes, try to refresh
    if (timeUntilExpiry < 5 * 60 * 1000 && session.refresh_token) {
      try {
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshError || !refreshedSession) {
          // Refresh failed - don't redirect, let client handle it
          console.log('[Middleware] Session refresh failed, allowing client-side handling')
        }
      } catch (err) {
        console.error('[Middleware] Session refresh error:', err)
        // Continue with current session if refresh fails
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - paths with extensions (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\.).*)',
  ],
}
