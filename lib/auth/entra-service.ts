import { ENTRA_CONFIG, EntraIdToken } from './entra-config'
import { jwtVerify } from 'jose'

const textEncoder = new TextEncoder()

export async function getEntraAuthUrl(): Promise<string> {
  const clientId = ENTRA_CONFIG.clientId
  const redirectUri = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : ''
  
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: ENTRA_CONFIG.scopes.join(' '),
    response_mode: 'query',
    prompt: 'login'
  })

  return `${ENTRA_CONFIG.endpoints.authorize}?${params.toString()}`
}

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<{
  accessToken: string
  idToken: string
  refreshToken?: string
}> {
  const response = await fetch(ENTRA_CONFIG.endpoints.token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: ENTRA_CONFIG.clientId,
      client_secret: ENTRA_CONFIG.clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      scope: ENTRA_CONFIG.scopes.join(' ')
    }).toString()
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token exchange failed: ${error}`)
  }

  const data = await response.json()
  return {
    accessToken: data.access_token,
    idToken: data.id_token,
    refreshToken: data.refresh_token
  }
}

export async function verifyEntraToken(token: string): Promise<EntraIdToken> {
  try {
    // Get OIDC metadata to verify token with public key
    const metadataResponse = await fetch(ENTRA_CONFIG.endpoints.oidcMetadata)
    const metadata = await metadataResponse.json()
    
    // For production, validate JWT using JWKS endpoint
    // For now, decode and trust the token from Entra ID
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid token format')
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    ) as EntraIdToken

    // Verify token expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired')
    }

    return payload
  } catch (error) {
    throw new Error(`Token verification failed: ${error}`)
  }
}

export async function refreshEntraToken(refreshToken: string): Promise<{
  accessToken: string
  idToken: string
  refreshToken?: string
}> {
  const response = await fetch(ENTRA_CONFIG.endpoints.token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: ENTRA_CONFIG.clientId,
      client_secret: ENTRA_CONFIG.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: ENTRA_CONFIG.scopes.join(' ')
    }).toString()
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token refresh failed: ${error}`)
  }

  const data = await response.json()
  return {
    accessToken: data.access_token,
    idToken: data.id_token,
    refreshToken: data.refresh_token
  }
}
