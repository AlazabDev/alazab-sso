import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get linked accounts
    const { data: accounts, error } = await supabase
      .from('oauth_accounts')
      .select('id, provider, provider_email, created_at')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching accounts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch accounts' },
        { status: 500 }
      )
    }

    return NextResponse.json(accounts)
  } catch (error) {
    console.error('Get accounts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      )
    }

    // Delete linked account
    const { error } = await supabase
      .from('oauth_accounts')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', provider)

    if (error) {
      console.error('Error deleting account:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
