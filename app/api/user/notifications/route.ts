import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/client'
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount,
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

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const isRead = searchParams.get('is_read')

    const result = await getUserNotifications(user.id, {
      limit,
      offset,
      isRead: isRead ? isRead === 'true' : undefined,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Notifications API] Error:', error)
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
    const { notificationId, action } = body

    if (action === 'mark_as_read' && notificationId) {
      await markNotificationAsRead(notificationId)
      return NextResponse.json({ success: true })
    } else if (action === 'mark_all_as_read') {
      await markAllNotificationsAsRead(user.id)
      return NextResponse.json({ success: true })
    } else if (action === 'delete' && notificationId) {
      await deleteNotification(notificationId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[Notifications API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
