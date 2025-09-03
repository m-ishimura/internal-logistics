import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJWTEdge } from '@/lib/auth'

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/me', '/api/auth/logout', '/api/auth/entra-id', '/api/auth/callback']
const PROTECTED_PATHS = ['/dashboard', '/items', '/shipments', '/reports']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth-token')?.value

  console.log(`[Middleware] ${pathname} - Token: ${token ? 'exists' : 'none'}`)

  // Allow public paths without authentication
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    console.log(`[Middleware] ${pathname} - Public path, allowing`)
    return NextResponse.next()
  }

  // Check if the path requires authentication
  const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path))
  const isApiPath = pathname.startsWith('/api/')
  console.log(`[Middleware] ${pathname} - Protected: ${isProtectedPath} - API: ${isApiPath}`)
  
  // If no token, redirect to login for protected paths
  if (isProtectedPath && !token) {
    console.log(`[Middleware] ${pathname} - No token, redirecting to login`)
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // For API paths and protected paths with token, add user info headers
  if ((isApiPath || isProtectedPath) && token) {
    try {
      // Use Edge-compatible JWT verification only
      const payload = await verifyJWTEdge(token)
      if (payload) {
        console.log(`[Middleware] ${pathname} - JWT verified successfully`)
        console.log(`[Middleware] ${pathname} - Payload:`, { userId: payload.userId, email: payload.email })
        
        const response = NextResponse.next()
        response.headers.set('x-user-id', payload.userId)
        response.headers.set('x-user-email', payload.email)
        // Remove role and departmentId headers - will be fetched from DB in each API
        
        console.log(`[Middleware] ${pathname} - Headers added successfully`)
        return response
      } else {
        console.log(`[Middleware] ${pathname} - JWT verification failed`)
        throw new Error('JWT verification failed')
      }
    } catch (error) {
      console.log(`[Middleware] ${pathname} - JWT verification failed:`, error)
      // If JWT is invalid and it's a protected path, redirect to login
      if (isProtectedPath) {
        console.log(`[Middleware] ${pathname} - Redirecting to login due to invalid token`)
        const loginUrl = new URL('/login', request.url)
        return NextResponse.redirect(loginUrl)
      } else {
        // For API paths, return 401
        console.log(`[Middleware] ${pathname} - API path with invalid token, returning 401`)
        return NextResponse.json(
          { success: false, error: 'Authentication failed' },
          { status: 401 }
        )
      }
    }
  }

  // Redirect users with tokens away from login page
  if (token && pathname === '/login') {
    console.log(`[Middleware] ${pathname} - Has token on login page, redirecting to dashboard`)
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  console.log(`[Middleware] ${pathname} - Default next()`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)'
  ]
}