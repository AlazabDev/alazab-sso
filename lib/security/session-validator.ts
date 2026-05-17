import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function validateSession(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return request.cookies.getSetCookie()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  return { supabase, session, response }
}

export async function requireAuth(
  request: NextRequest,
  handler: (request: NextRequest, response: NextResponse) => Promise<NextResponse>
) {
  const { supabase, session, response } = await validateSession(request)

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.nextUrl))
  }

  return handler(request, response)
}

export interface SessionContext {
  userId: string
  email: string
  provider: string
  expiresAt: number
  isExpired: boolean
  refreshToken?: string
}

export async function getSessionContext(
  request: NextRequest
): Promise<SessionContext | null> {
  const { supabase, session } = await validateSession(request)

  if (!session) {
    return null
  }

  const expiresAt = session.expires_at || 0
  const isExpired = Date.now() / 1000 > expiresAt

  // Get user's current provider
  const { data: accounts } = await supabase
    .from('accounts')
    .select('provider')
    .eq('user_id', session.user.id)
    .limit(1)

  return {
    userId: session.user.id,
    email: session.user.email || '',
    provider: accounts?.[0]?.provider || 'email',
    expiresAt,
    isExpired,
    refreshToken: session.refresh_token
  }
}

export async function validateEntraToken(idToken: string): Promise<{
  oid: string
  email: string
  isValid: boolean
}> {
  try {
    const parts = idToken.split('.')
    if (parts.length !== 3) {
      return { oid: '', email: '', isValid: false }
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    )

    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return { oid: '', email: '', isValid: false }
    }

    return {
      oid: payload.oid,
      email: payload.email,
      isValid: true
    }
  } catch {
    return { oid: '', email: '', isValid: false }
  }
}
