import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ENTRA_CONFIG } from '@/lib/auth/entra-config'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    // Get user's accounts to check if Entra is linked
    const { data: accounts } = await supabase
      .from('accounts')
      .select('provider, id_token')
      .eq('user_id', session?.user.id)

    const entraAccount = accounts?.find(a => a.provider === 'entra')

    // Sign out from Supabase
    await supabase.auth.signOut()

    const response = NextResponse.json({ message: 'Logged out successfully' })

    // Clear auth cookies
    response.cookies.delete('auth-token')
    response.cookies.delete('auth-refresh')

    // If Entra account exists, redirect to Entra logout
    if (entraAccount) {
      const logoutUrl = new URL('https://login.microsoftonline.com/logout.srf')
      logoutUrl.searchParams.set('lp', '1')
      logoutUrl.searchParams.set('returnUrl', `${request.nextUrl.origin}/login`)

      return NextResponse.redirect(logoutUrl)
    }

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Also support GET for logout
  return POST(request)
}
