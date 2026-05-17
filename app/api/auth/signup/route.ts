import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, fullName, userType = 'customer' } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Sign up new user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0],
          user_type: userType,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Log signup attempt
    const { error: auditError } = await supabase
      .from('login_audit')
      .insert({
        email,
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
    console.error('Sign up error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
