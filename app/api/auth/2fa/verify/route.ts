import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/client'
import { verifyTwoFACode } from '@/lib/services/two-fa.service'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code || code.length < 6) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await getSupabaseAdminClient().auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const isValid = await verifyTwoFACode(user.id, code.replace(/\s/g, ''))

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 401 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error verifying 2FA code:', error)
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    )
  }
}
