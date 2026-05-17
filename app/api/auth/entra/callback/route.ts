import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken, verifyEntraToken } from '@/lib/auth/entra-service'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${error}&description=${errorDescription}`, request.nextUrl.origin)
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/login?error=no_code', request.nextUrl.origin)
      )
    }

    // Exchange code for token
    const redirectUri = `${request.nextUrl.origin}/api/auth/entra/callback`
    const tokens = await exchangeCodeForToken(code, redirectUri)

    // Verify and decode token
    const entraUser = await verifyEntraToken(tokens.idToken)

    // Get Supabase client
    const supabase = await createClient()

    // Create or update user in Supabase
    const { data: user, error: signUpError } = await supabase.auth.admin.createUser({
      email: entraUser.email,
      email_confirm: true,
      user_metadata: {
        full_name: entraUser.name,
        given_name: entraUser.given_name,
        family_name: entraUser.family_name,
        entra_oid: entraUser.oid,
      }
    })

    if (signUpError && signUpError.message !== 'User already exists') {
      return NextResponse.redirect(
        new URL(`/login?error=user_creation_failed&description=${signUpError.message}`, request.nextUrl.origin)
      )
    }

    // Link Entra account
    const { error: accountError } = await supabase
      .from('accounts')
      .upsert({
        user_id: user?.id,
        provider: 'entra',
        provider_account_id: entraUser.oid,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_expires_at: new Date(entraUser.exp * 1000),
        id_token: tokens.idToken,
      }, {
        onConflict: 'user_id,provider'
      })

    if (accountError) {
      console.error('Account linking error:', accountError)
    }

    // Create session
    const { data: session, error: sessionError } = await supabase.auth.admin.createSession(user?.id || '')

    if (sessionError) {
      return NextResponse.redirect(
        new URL(`/login?error=session_creation_failed`, request.nextUrl.origin)
      )
    }

    // Set session cookie
    const response = NextResponse.redirect(new URL('/dashboard', request.nextUrl.origin))
    
    if (session?.access_token) {
      response.cookies.set({
        name: 'auth-token',
        value: session.access_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
      })
    }

    return response
  } catch (error) {
    console.error('Entra callback error:', error)
    return NextResponse.redirect(
      new URL(`/login?error=authentication_failed&description=${error instanceof Error ? error.message : 'Unknown error'}`, request.nextUrl.origin)
    )
  }
}
