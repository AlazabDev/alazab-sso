import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/client'
import { getIPBlocklist, addToIPBlocklist, removeFromIPBlocklist } from '@/lib/services/security.service'

async function checkAdminAccess(token: string): Promise<boolean> {
  try {
    const { data: { user }, error: authError } = await getSupabaseAdminClient().auth.getUser(token)
    if (authError || !user) return false

    const { data: adminData } = await getSupabaseAdminClient()
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    return !!adminData && ['super_admin', 'admin'].includes(adminData.role)
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const isAdmin = await checkAdminAccess(token)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '100')
    const blocklist = await getIPBlocklist(limit)

    return NextResponse.json({ success: true, data: blocklist })
  } catch (error) {
    console.error('[v0] Error fetching blocklist:', error)
    return NextResponse.json({ error: 'Failed to fetch blocklist' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ipAddress, reason, isPermanent } = await request.json()

    if (!ipAddress) {
      return NextResponse.json({ error: 'IP address required' }, { status: 400 })
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await getSupabaseAdminClient().auth.getUser(token)
    const isAdmin = await checkAdminAccess(token)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const result = await addToIPBlocklist(ipAddress, reason || 'Security incident', isPermanent, null, user?.id)

    return NextResponse.json({ success: !!result, data: result })
  } catch (error) {
    console.error('[v0] Error adding to blocklist:', error)
    return NextResponse.json({ error: 'Failed to add to blocklist' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { ipAddress } = await request.json()

    if (!ipAddress) {
      return NextResponse.json({ error: 'IP address required' }, { status: 400 })
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const isAdmin = await checkAdminAccess(token)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const success = await removeFromIPBlocklist(ipAddress)

    return NextResponse.json({ success })
  } catch (error) {
    console.error('[v0] Error removing from blocklist:', error)
    return NextResponse.json({ error: 'Failed to remove from blocklist' }, { status: 500 })
  }
}
