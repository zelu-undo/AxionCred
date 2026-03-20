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

  // Simple cookie check - just verify if auth cookies exist
  // Let the client-side handle actual session validation
  const allCookies = req.cookies.getAll()
  
  // Debug: log cookie names
  console.log("All cookies:", allCookies.map(c => c.name))
  
  // Check for ANY Supabase cookies (they start with sb-)
  // This is more permissive to avoid logout issues
  const hasSupabaseCookie = allCookies.some(c => c.name.startsWith('sb-'))

  // If no Supabase cookies, redirect to login
  if (!hasSupabaseCookie) {
    console.log("No Supabase cookies found, redirecting to login")
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  console.log("Supabase cookies found, allowing access")

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (['/login', '/register'].includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Create response and pass through
  const response = NextResponse.next()
  
  // Copy headers
  req.headers.forEach((value, key) => {
    response.headers.set(key, value)
  })
  
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
