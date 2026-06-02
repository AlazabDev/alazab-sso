import { createBrowserClient } from '@supabase/ssr'
import { createClient as createServerClient } from '@supabase/supabase-js'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Server-side admin client (lazy initialized)
let adminClientInstance: ReturnType<typeof createServerClient> | null = null

export function getSupabaseAdminClient() {
  if (!adminClientInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials')
    }

    adminClientInstance = createServerClient(supabaseUrl, supabaseKey)
  }
  return adminClientInstance
}
