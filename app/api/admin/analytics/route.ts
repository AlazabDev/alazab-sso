import { NextRequest, NextResponse } from 'next/server'
import { getDashboardStats } from '@/lib/services/admin.service'
import { isUserAdmin } from '@/lib/services/admin.service'
import { getSupabaseAdminClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: authError,
    } = await getSupabaseAdminClient().auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const stats = await getDashboardStats()

    if (!stats) {
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 400 }
      )
    }

    return NextResponse.json(stats, { status: 200 })
  } catch (error) {
    console.error('[v0] Error in analytics GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
