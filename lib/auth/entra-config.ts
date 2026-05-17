export const ENTRA_CONFIG = {
  tenantId: '54f7523b-7bc4-438e-83d5-e45e17302fd4',
  authority: 'https://login.microsoftonline.com/54f7523b-7bc4-438e-83d5-e45e17302fd4',
  clientId: process.env.NEXT_PUBLIC_ENTRA_CLIENT_ID || '',
  clientSecret: process.env.ENTRA_CLIENT_SECRET || '',
  redirectUri: typeof window !== 'undefined' 
    ? `${window.location.origin}/auth/callback` 
    : '',
  scopes: ['openid', 'profile', 'email', 'User.Read'],
  endpoints: {
    authorize: 'https://login.microsoftonline.com/54f7523b-7bc4-438e-83d5-e45e17302fd4/oauth2/v2.0/authorize',
    token: 'https://login.microsoftonline.com/54f7523b-7bc4-438e-83d5-e45e17302fd4/oauth2/v2.0/token',
    oidcMetadata: 'https://login.microsoftonline.com/54f7523b-7bc4-438e-83d5-e45e17302fd4/v2.0/.well-known/openid-configuration'
  }
}

export interface EntraIdToken {
  oid: string
  email: string
  name: string
  given_name: string
  family_name: string
  iat: number
  exp: number
}
