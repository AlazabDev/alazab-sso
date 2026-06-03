import { NextRequest, NextResponse } from 'next/server'
import { getAllProviders, createProvider } from '@/lib/services/provider.service'
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type') || undefined
    const isActive = searchParams.get('is_active') ? searchParams.get('is_active') === 'true' : undefined
    const search = searchParams.get('search') || undefined

    const result = await getAllProviders(
      { type: type as any, is_active: isActive, search },
      { page, limit }
    )

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[v0] Error in providers GET:', error)
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
    if (
      !body.name ||
      !body.type ||
      !body.provider_key ||
      !body.client_id ||
      !body.client_secret ||
      !body.redirect_uri
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const newProvider = await createProvider(body)

    if (!newProvider) {
      return NextResponse.json(
        { error: 'Failed to create provider' },
        { status: 400 }
      )
    }

    return NextResponse.json(newProvider, { status: 201 })
  } catch (error) {
    console.error('[v0] Error in providers POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
