/**
 * Centralized Authentication Service
 * Handles all OAuth flows, email/password auth, WhatsApp OTP, and Alazab SSO
 * No API keys exposed in frontend - all sensitive operations go through backend
 */

export interface AuthError {
  code: string
  message: string
  details?: any
}

export interface AuthResponse {
  success: boolean
  error?: AuthError
  data?: any
}

// Google OAuth Handler
export async function handleGoogleLogin(): Promise<AuthResponse> {
  try {
    // This would redirect to Google OAuth consent screen
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const redirectUri = `${window.location.origin}/auth/callback/google`
    const scope = 'openid profile email'

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.append('client_id', clientId || '')
    authUrl.searchParams.append('redirect_uri', redirectUri)
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('scope', scope)

    window.location.href = authUrl.toString()

    return { success: true }
  } catch (error) {
    console.error('[Auth Service] Google login error:', error)
    return {
      success: false,
      error: {
        code: 'GOOGLE_LOGIN_ERROR',
        message: 'فشل تسجيل الدخول عبر Google',
        details: error
      }
    }
  }
}

// Facebook OAuth Handler
export async function handleFacebookLogin(): Promise<AuthResponse> {
  try {
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
    const redirectUri = `${window.location.origin}/auth/callback/facebook`
    const scope = 'public_profile,email'

    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth')
    authUrl.searchParams.append('client_id', appId || '')
    authUrl.searchParams.append('redirect_uri', redirectUri)
    authUrl.searchParams.append('scope', scope)

    window.location.href = authUrl.toString()

    return { success: true }
  } catch (error) {
    console.error('[Auth Service] Facebook login error:', error)
    return {
      success: false,
      error: {
        code: 'FACEBOOK_LOGIN_ERROR',
        message: 'فشل تسجيل الدخول عبر Facebook',
        details: error
      }
    }
  }
}

// Email/Password Login Handler
export async function handleEmailLogin(email: string, password: string): Promise<AuthResponse> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const response = await fetch(`${apiUrl}/api/auth/email-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // Include cookies for session
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: {
          code: 'EMAIL_LOGIN_ERROR',
          message: errorData.message || 'فشل تسجيل الدخول',
          details: errorData
        }
      }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('[Auth Service] Email login error:', error)
    return {
      success: false,
      error: {
        code: 'EMAIL_LOGIN_ERROR',
        message: 'حدث خطأ في تسجيل الدخول، يرجى المحاولة لاحقاً',
        details: error
      }
    }
  }
}

// WhatsApp OTP - Send Step
export async function handleSendWhatsAppOtp(phoneNumber: string): Promise<AuthResponse> {
  try {
    // Validate phone number format
    if (!phoneNumber.match(/^\+?[0-9]{7,15}$/)) {
      return {
        success: false,
        error: {
          code: 'INVALID_PHONE',
          message: 'رقم الهاتف غير صحيح',
        }
      }
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const response = await fetch(`${apiUrl}/api/auth/whatsapp/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber }),
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: {
          code: 'WHATSAPP_SEND_ERROR',
          message: errorData.message || 'فشل إرسال رمز التحقق',
          details: errorData
        }
      }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('[Auth Service] WhatsApp send OTP error:', error)
    return {
      success: false,
      error: {
        code: 'WHATSAPP_SEND_ERROR',
        message: 'حدث خطأ في إرسال رمز التحقق، يرجى المحاولة لاحقاً',
        details: error
      }
    }
  }
}

// WhatsApp OTP - Verify Step
export async function handleVerifyWhatsAppOtp(phoneNumber: string, otpCode: string): Promise<AuthResponse> {
  try {
    // Validate OTP format
    if (!otpCode.match(/^[0-9]{6}$/)) {
      return {
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: 'رمز التحقق يجب أن يكون 6 أرقام',
        }
      }
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const response = await fetch(`${apiUrl}/api/auth/whatsapp/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber, otpCode }),
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: {
          code: 'WHATSAPP_VERIFY_ERROR',
          message: errorData.message || 'فشل التحقق من رمز التحقق',
          details: errorData
        }
      }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('[Auth Service] WhatsApp verify OTP error:', error)
    return {
      success: false,
      error: {
        code: 'WHATSAPP_VERIFY_ERROR',
        message: 'حدث خطأ في التحقق، يرجى المحاولة لاحقاً',
        details: error
      }
    }
  }
}

// WhatsApp OTP - Resend Step
export async function handleResendWhatsAppOtp(phoneNumber: string): Promise<AuthResponse> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const response = await fetch(`${apiUrl}/api/auth/whatsapp/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber }),
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: {
          code: 'WHATSAPP_RESEND_ERROR',
          message: errorData.message || 'فشل إعادة إرسال رمز التحقق',
          details: errorData
        }
      }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('[Auth Service] WhatsApp resend OTP error:', error)
    return {
      success: false,
      error: {
        code: 'WHATSAPP_RESEND_ERROR',
        message: 'حدث خطأ في إعادة الإرسال، يرجى المحاولة لاحقاً',
        details: error
      }
    }
  }
}

// Alazab SSO with OIDC + PKCE
export async function handleAlazabSsoLogin(): Promise<AuthResponse> {
  try {
    // Generate PKCE code challenge
    const codeVerifier = generateRandomString(128)
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    // Store verifier in sessionStorage for later verification
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('oauth_code_verifier', codeVerifier)
      sessionStorage.setItem('oauth_state', generateRandomString(32))
    }

    const state = sessionStorage.getItem('oauth_state') || ''
    const clientId = process.env.NEXT_PUBLIC_ALAZAB_CLIENT_ID
    const redirectUri = `${window.location.origin}/auth/callback/alazab`
    const ssoUrl = process.env.NEXT_PUBLIC_ALAZAB_SSO_URL || 'https://auth.alazab.com'

    const authUrl = new URL(`${ssoUrl}/oauth/authorize`)
    authUrl.searchParams.append('client_id', clientId || '')
    authUrl.searchParams.append('redirect_uri', redirectUri)
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('scope', 'openid profile email')
    authUrl.searchParams.append('code_challenge', codeChallenge)
    authUrl.searchParams.append('code_challenge_method', 'S256')
    authUrl.searchParams.append('state', state)

    window.location.href = authUrl.toString()

    return { success: true }
  } catch (error) {
    console.error('[Auth Service] Alazab SSO error:', error)
    return {
      success: false,
      error: {
        code: 'ALAZAB_SSO_ERROR',
        message: 'فشل تسجيل الدخول عبر منظومة العزب',
        details: error
      }
    }
  }
}

// Helper: Generate random string for PKCE
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return result
}

// Helper: Generate SHA256 code challenge from verifier
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(codeVerifier)
  const digest = await crypto.subtle.digest('SHA-256', data)

  // Convert to base64url
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}
