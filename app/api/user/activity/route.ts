import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/client'
import { getUserActivityLogs } from '@/lib/services/activity.service'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const actionType = searchParams.get('action_type') || undefined

    const result = await getUserActivityLogs(user.id, {
      limit,
      offset,
      action_type: actionType as any,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Activity API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
