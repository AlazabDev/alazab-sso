import { NextRequest, NextResponse } from 'next/server'
import { getProvider, updateProvider, deleteProvider, toggleProviderStatus, getProviderStats } from '@/lib/services/provider.service'
import { isUserAdmin, createAuditLog } from '@/lib/services/admin.service'
import { getSupabaseAdminClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const provider = await getProvider(params.id)

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    const stats = await getProviderStats(params.id)

    return NextResponse.json({ ...provider, stats }, { status: 200 })
  } catch (error) {
    console.error('[v0] Error in provider GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const updatedProvider = await updateProvider(params.id, body)

    if (!updatedProvider) {
      return NextResponse.json(
        { error: 'Failed to update provider' },
        { status: 400 }
      )
    }

    // Log the audit
    await createAuditLog(
      user.id,
      'UPDATE_PROVIDER',
      'auth_providers',
      params.id,
      body,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined,
      'success'
    )

    return NextResponse.json(updatedProvider, { status: 200 })
  } catch (error) {
    console.error('[v0] Error in provider PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const success = await deleteProvider(params.id)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete provider' },
        { status: 400 }
      )
    }

    // Log the audit
    await createAuditLog(
      user.id,
      'DELETE_PROVIDER',
      'auth_providers',
      params.id,
      {},
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined,
      'success'
    )

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[v0] Error in provider DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
