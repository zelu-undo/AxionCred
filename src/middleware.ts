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

  // Get session and refresh if needed
  const { data: { session }, error } = await supabase.auth.getSession()

  // If there's an error or no session, redirect to login
  if (error || !session) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
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
          // Refresh failed, redirect to login
          const redirectUrl = new URL('/login', req.url)
          redirectUrl.searchParams.set('redirect', pathname)
          return NextResponse.redirect(redirectUrl)
        }
      } catch (err) {
        console.error('Session refresh error:', err)
        // Continue with current session if refresh fails
      }
    }
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (['/login', '/register'].includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
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
