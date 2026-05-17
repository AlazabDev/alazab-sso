import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

const publicRoutes = ['/login', '/signup', '/auth/callback']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Handle CORS and security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Create a Supabase client for session validation
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Get current user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Redirect to login if accessing protected route without session
  if (!user && !publicRoutes.some(route => pathname.startsWith(route)) && !pathname.startsWith('/api/auth')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect to dashboard if accessing auth pages while already logged in
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
