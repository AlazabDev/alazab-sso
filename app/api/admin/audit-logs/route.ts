import { NextRequest, NextResponse } from 'next/server'
import { authMonitor } from '@/lib/monitoring/auth-monitor'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const provider = searchParams.get('provider') || undefined
    const status = (searchParams.get('status') as 'success' | 'failed') || undefined

    // Get filtered logs
    const logs = authMonitor.getLoginEvents({
      provider: provider,
      status: status,
      limit: 100,
    })

    // Get metrics
    const metrics = authMonitor.exportMetrics()

    return NextResponse.json({
      logs,
      metrics,
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}
