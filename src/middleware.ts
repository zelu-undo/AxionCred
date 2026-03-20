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
  
  console.log("[MIDDLEWARE] Starting - pathname:", pathname)
  
  // Skip RSC requests - these are internal Next.js requests
  const isRSC = searchParams.get('_rsc')
  if (isRSC) {
    console.log("[MIDDLEWARE] Skipping RSC request")
    return NextResponse.next()
  }

  // Skip static files and other assets
  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname.startsWith('/public') ||
    pathname.includes('.') // files with extensions
  ) {
    console.log("[MIDDLEWARE] Skipping static file")
    return NextResponse.next()
  }

  // Skip bypass routes
  if (bypassRoutes.some(route => pathname.startsWith(route))) {
    console.log("[MIDDLEWARE] Skipping bypass route")
    return NextResponse.next()
  }

  // Check if this is a public route
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )

  console.log("[MIDDLEWARE] isPublicRoute:", isPublicRoute)

  // If public route, just continue
  if (isPublicRoute) {
    console.log("[MIDDLEWARE] Allowing public route")
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

  // Check cookies first
  const allCookies = req.cookies.getAll()
  console.log("[MIDDLEWARE] All cookies:", allCookies.map(c => c.name))
  
  // Try to get session - but don't block if it takes too long
  // Use a simple timeout approach
  let session = null
  let hasSessionError = false
  
  try {
    // Check if auth cookies exist first - if they do, assume authenticated
    const authCookies = allCookies.filter(c => 
      c.name.includes('sb-') && (c.name.includes('auth') || c.name.includes('access'))
    )
    
    console.log("[MIDDLEWARE] Auth cookies found:", authCookies.length)
    
    if (authCookies.length > 0) {
      // Auth cookies exist - try to validate but don't wait too long
      console.log("[MIDDLEWARE] Validating session with Supabase...")
      const sessionPromise = supabase.auth.getSession()
      
      // Wait max 3 seconds for session check
      const timeoutPromise = new Promise((resolve) => 
        setTimeout(() => {
          console.log("[MIDDLEWARE] Session check timed out")
          resolve({ data: { session: null }, error: null })
        }, 3000)
      )
      
      const result = await Promise.race([sessionPromise, timeoutPromise]) as any
      
      console.log("[MIDDLEWARE] Session result:", { 
        hasSession: !!result?.data?.session, 
        hasError: !!result?.error,
        errorMessage: result?.error?.message 
      })
      
      if (result?.data?.session) {
        session = result.data.session
      }
      // If timeout but cookies exist, still allow - client will verify
    } else {
      // No auth cookies - definitely not authenticated
      console.log("[MIDDLEWARE] No auth cookies found - redirecting to login")
    }
  } catch (err) {
    console.log("[MIDDLEWARE] Session check error:", err)
    hasSessionError = true
  }

  // If there's an error or no session, redirect to login
  if (hasSessionError || !session) {
    console.log("[MIDDLEWARE] No valid session - redirecting to /login")
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  console.log("[MIDDLEWARE] Session valid - allowing access")

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (['/login', '/register'].includes(pathname)) {
    console.log("[MIDDLEWARE] Authenticated user on login page - redirecting to /dashboard")
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
