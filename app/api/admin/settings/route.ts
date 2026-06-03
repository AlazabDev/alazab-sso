import { NextRequest, NextResponse } from 'next/server'
import { getSetting, updateSetting, getAllSettings, createAuditLog } from '@/lib/services/admin.service'
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

    // Get specific setting or all settings
    const settingKey = request.nextUrl.searchParams.get('key')

    if (settingKey) {
      const setting = await getSetting(settingKey)
      if (!setting) {
        return NextResponse.json({ error: 'Setting not found' }, { status: 404 })
      }
      return NextResponse.json(setting, { status: 200 })
    }

    const settings = await getAllSettings()
    return NextResponse.json(settings, { status: 200 })
  } catch (error) {
    console.error('[v0] Error in settings GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()

    // Validate required fields
    if (!body.setting_key || body.setting_value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: setting_key, setting_value' },
        { status: 400 }
      )
    }

    const updatedSetting = await updateSetting(body.setting_key, body.setting_value)

    if (!updatedSetting) {
      return NextResponse.json(
        { error: 'Failed to update setting' },
        { status: 400 }
      )
    }

    // Log the audit
    await createAuditLog(
      user.id,
      'UPDATE_SETTING',
      'admin_settings',
      body.setting_key,
      { new_value: body.setting_value },
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined,
      'success'
    )

    return NextResponse.json(updatedSetting, { status: 200 })
  } catch (error) {
    console.error('[v0] Error in settings POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
