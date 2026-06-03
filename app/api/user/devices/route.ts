import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/client'
import { getUserDevices, deleteDevice } from '@/lib/services/device.service'

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

    const devices = await getUserDevices(user.id)
    return NextResponse.json({ devices })
  } catch (error) {
    console.error('[Devices API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { deviceId } = await request.json()

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      )
    }

    // Verify device belongs to user
    const devices = await getUserDevices(user.id)
    const device = devices.find(d => d.id === deviceId)

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }

    const result = await deleteDevice(deviceId)
    return NextResponse.json({ success: result })
  } catch (error) {
    console.error('[Devices API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
