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

    // Get current accounts
    const { data: accounts, error: fetchError } = await supabase
      .from('accounts')
      .select('provider')
      .eq('user_id', user.id)

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch accounts' },
        { status: 500 }
      )
    }

    // Prevent unlinking the only account
    if (accounts.length <= 1) {
      return NextResponse.json(
        { error: 'Cannot unlink your only account' },
        { status: 400 }
      )
    }

    // Delete the account link
    const { error: deleteError } = await supabase
      .from('accounts')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', provider)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to unlink account' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Account unlinked successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Account unlinking error:', error)
    return NextResponse.json(
      { error: 'Failed to unlink account' },
      { status: 500 }
    )
  }
}
