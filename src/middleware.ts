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
  
  // Skip RSC requests
  const isRSC = searchParams.get('_rsc')
  if (isRSC) {
    return NextResponse.next()
  }

  // Skip static files
  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname.startsWith('/public') ||
    pathname.includes('.')
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

  // Create Supabase client for session validation
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

  // Check if auth cookies exist first
  const allCookies = req.cookies.getAll()
  const hasAuthCookies = allCookies.some(c => c.name.startsWith('sb-'))
  
  if (!hasAuthCookies) {
    // No auth cookies - redirect to login
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Try to validate session with timeout
  let session = null
  let sessionCheckTimeout = false
  
  try {
    const sessionPromise = supabase.auth.getSession()
    
    // 3 second timeout for session validation
    const timeoutPromise = new Promise<{ data: { session: any }; error: any }>((resolve) => 
      setTimeout(() => {
        sessionCheckTimeout = true
        resolve({ data: { session: null }, error: null })
      }, 3000)
    )
    
    const result = await Promise.race([sessionPromise, timeoutPromise]) as any
    
    if (result?.data?.session) {
      session = result.data.session
    }
  } catch (err) {
    // Session check failed - will allow temporary access
  }

  if (!session) {
    // Timeout or error - allow temporary access but set header for client revalidation
    response.headers.set('x-session-pending', 'true')
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (['/login', '/register'].includes(pathname) && session) {
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
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
}
