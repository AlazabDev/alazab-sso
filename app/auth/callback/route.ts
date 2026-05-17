import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('Auth error:', error, error_description)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error_description || error)}`, request.url)
    )
  }

  if (code) {
    const supabase = await createClient()

    // Exchange code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Exchange error:', exchangeError)
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(exchangeError.message)}`,
          request.url
        )
      )
    }

    // Log successful login
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // Insert login audit record
      const { error: auditError } = await supabase
        .from('login_audit')
        .insert({
          user_id: user.id,
          email: user.email,
          provider: user.app_metadata?.provider || 'email',
          login_method: 'oauth',
          status: 'success',
          user_agent: request.headers.get('user-agent'),
          device_info: {
            platform: request.headers.get('user-agent'),
          },
        })

      if (auditError) {
        console.error('Audit error:', auditError)
      }
    }

    // Redirect to dashboard on success
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.redirect(new URL('/login', request.url))
}
