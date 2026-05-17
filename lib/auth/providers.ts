export type OAuthProvider = 'google' | 'apple' | 'facebook' | 'github'

export interface SignInOptions {
  provider: OAuthProvider
  redirectTo?: string
}

function getSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('This function must be called from the client side')
  }
  const { createBrowserClient } = require('@supabase/ssr')
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )
}

export async function signInWithOAuth(options: SignInOptions) {
  const supabase = getSupabaseClient()
  
  const redirectUrl = options.redirectTo || `${window.location.origin}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: options.provider,
    options: {
      redirectTo: redirectUrl,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName?: string
) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function signOut() {
  const supabase = getSupabaseClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(error.message)
  }
}

export async function resetPassword(email: string) {
  const supabase = getSupabaseClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function updatePassword(newPassword: string) {
  const supabase = getSupabaseClient()

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    throw new Error(error.message)
  }
}
