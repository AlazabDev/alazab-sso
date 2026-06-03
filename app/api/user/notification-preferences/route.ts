import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/client'
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/lib/services/notification.service'

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

    const preferences = await getNotificationPreferences(user.id)
    return NextResponse.json(preferences)
  } catch (error) {
    console.error('[Preferences API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const preferences = await updateNotificationPreferences(user.id, body)

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('[Preferences API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
