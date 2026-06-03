import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/client'
import { getAllIncidents, resolveIncident } from '@/lib/services/security.service'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await getSupabaseAdminClient().auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminData } = await getSupabaseAdminClient()
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!adminData || !['super_admin', 'admin'].includes(adminData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const incidents = await getAllIncidents(limit)

    return NextResponse.json({ success: true, data: incidents })
  } catch (error) {
    console.error('[v0] Error fetching incidents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch incidents' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { incidentId, note } = await request.json()

    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await getSupabaseAdminClient().auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminData } = await getSupabaseAdminClient()
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!adminData || !['super_admin', 'admin'].includes(adminData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const success = await resolveIncident(incidentId, note)

    return NextResponse.json({ success })
  } catch (error) {
    console.error('[v0] Error resolving incident:', error)
    return NextResponse.json(
      { error: 'Failed to resolve incident' },
      { status: 500 }
    )
  }
}
