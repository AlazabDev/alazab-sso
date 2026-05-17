import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { signInWithOAuth } from '@/lib/auth/providers'
import { authMonitor } from '@/lib/monitoring/auth-monitor'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, refreshToken, provider } = body

    if (!userId || !refreshToken || !provider) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get account record
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single()

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // Check if refresh token is valid
    if (account.refresh_token !== refreshToken) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      )
    }

    // Refresh token based on provider
    let newTokens: any = null

    if (provider === 'google') {
      newTokens = await refreshGoogleToken(refreshToken)
    } else if (provider === 'entra') {
      newTokens = await refreshEntraToken(refreshToken)
    } else if (provider === 'apple') {
      newTokens = await refreshAppleToken(refreshToken)
    } else {
      return NextResponse.json(
        { error: 'Provider refresh not supported' },
        { status: 400 }
      )
    }

    if (!newTokens) {
      return NextResponse.json(
        { error: 'Token refresh failed' },
        { status: 500 }
      )
    }

    // Update account with new tokens
    const { error: updateError } = await supabase
      .from('accounts')
      .update({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token || refreshToken,
        expires_at: new Date(Date.now() + newTokens.expires_in * 1000),
      })
      .eq('id', account.id)

    if (updateError) {
      console.error('Failed to update account tokens:', updateError)
      return NextResponse.json(
        { error: 'Failed to update tokens' },
        { status: 500 }
      )
    }

    authMonitor.recordLoginAttempt({
      userId,
      email: user.email || '',
      provider,
      status: 'success',
      ipAddress: request.headers.get('x-forwarded-for') || '',
      userAgent: request.headers.get('user-agent') || '',
      timestamp: new Date(),
    })

    return NextResponse.json({
      success: true,
      accessToken: newTokens.access_token,
      refreshToken: newTokens.refresh_token || refreshToken,
      expiresIn: newTokens.expires_in,
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function refreshGoogleToken(refreshToken: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    return null
  }

  return response.json()
}

async function refreshEntraToken(refreshToken: string) {
  const response = await fetch(
    'https://login.microsoftonline.com/54f7523b-7bc4-438e-83d5-e45e17302fd4/oauth2/v2.0/token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_ENTRA_CLIENT_ID || '',
        client_secret: process.env.ENTRA_CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'openid profile email offline_access',
      }),
    }
  )

  if (!response.ok) {
    return null
  }

  return response.json()
}

async function refreshAppleToken(refreshToken: string) {
  // Apple doesn't support refresh token refresh
  // Need to re-authenticate
  return null
}
