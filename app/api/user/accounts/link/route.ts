import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { provider } = body

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      )
    }

    // Store linking state for callback
    // The OAuth callback will detect this and link the account
    const response = NextResponse.json(
      { message: 'Linking initiated' },
      { status: 200 }
    )

    // Set a flag in cookie to indicate linking mode
    response.cookies.set({
      name: 'link-provider',
      value: provider,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 // 1 hour
    })

    return response
  } catch (error) {
    console.error('Account linking error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate account linking' },
      { status: 500 }
    )
  }
}
