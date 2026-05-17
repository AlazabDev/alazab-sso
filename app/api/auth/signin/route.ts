import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/security/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Rate limiting by email
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimit = checkRateLimit(`${email}:${ipAddress}`, 'login')

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many login attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        { status: 429 }
      )
    }

    const supabase = await createClient()

    // Sign in with email
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Log failed login attempt
      const { error: auditError } = await supabase
        .from('login_audit')
        .insert({
          email,
          login_method: 'email',
          status: 'failed',
          failure_reason: error.message,
          user_agent: request.headers.get('user-agent'),
        })

      if (auditError) {
        console.error('Audit error:', auditError)
      }

      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // Log successful login
    const { error: auditError } = await supabase
      .from('login_audit')
      .insert({
        user_id: data.user.id,
        email: data.user.email,
        login_method: 'email',
        status: 'success',
        user_agent: request.headers.get('user-agent'),
      })

    if (auditError) {
      console.error('Audit error:', auditError)
    }

    return NextResponse.json({
      user: data.user,
      session: data.session,
    })
  } catch (error) {
    console.error('Sign in error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
