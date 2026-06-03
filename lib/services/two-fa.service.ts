'use server'

import { getSupabaseAdminClient } from '@/lib/supabase/client'
import crypto from 'crypto'
import type { TwoFASecret, SetupTwoFAResponse, VerifyTwoFARequest } from '@/lib/types/security.types'

const BACKUP_CODES_COUNT = 10
const BACKUP_CODE_LENGTH = 8

/**
 * Generate random backup codes for 2FA emergency access
 */
function generateBackupCodes(count: number = BACKUP_CODES_COUNT): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const code = crypto
      .randomBytes(4)
      .toString('hex')
      .toUpperCase()
      .substring(0, BACKUP_CODE_LENGTH)
    codes.push(code)
  }
  return codes
}

/**
 * Generate TOTP secret (base32 encoded)
 * Compatible with Google Authenticator, Authy, Microsoft Authenticator, etc.
 */
function generateTOTPSecret(): string {
  const bytes = crypto.randomBytes(20)
  return base32Encode(bytes)
}

/**
 * Base32 encode for TOTP compatibility
 */
function base32Encode(buf: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = 0
  let value = 0
  let output = ''

  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i]
    bits += 8

    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31]
  }

  // Add padding
  while (output.length % 8 !== 0) {
    output += '='
  }

  return output
}

/**
 * TOTP verification using Node's crypto
 * Time-based one-time password (RFC 6238)
 */
function verifyTOTP(secret: string, token: string, window: number = 1): boolean {
  const secretBytes = base32Decode(secret)
  const now = Math.floor(Date.now() / 1000)
  const timeStep = 30

  for (let i = -window; i <= window; i++) {
    let counter = Math.floor((now + i * timeStep) / timeStep)
    const hmac = crypto.createHmac('sha1', secretBytes)
    
    const buf = Buffer.alloc(8)
    for (let j = 7; j >= 0; j--) {
      buf[j] = counter & 0xff
      counter >>>= 8
    }

    hmac.update(buf)
    const digest = hmac.digest()
    const offset = digest[digest.length - 1] & 0xf
    const code =
      ((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff)

    const totp = (code % 1000000).toString().padStart(6, '0')
    if (totp === token) {
      return true
    }
  }

  return false
}

/**
 * Base32 decode
 */
function base32Decode(encoded: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = 0
  let value = 0
  const output: number[] = []

  for (let i = 0; i < encoded.length; i++) {
    const index = alphabet.indexOf(encoded[i])
    if (index === -1) continue

    value = (value << 5) | index
    bits += 5

    if (bits >= 8) {
      bits -= 8
      output.push((value >>> bits) & 0xff)
    }
  }

  return Buffer.from(output)
}

export async function setupTwoFA(userId: string): Promise<SetupTwoFAResponse> {
  const secret = generateTOTPSecret()
  const backupCodes = generateBackupCodes()

  // Generate QR code URL (for Google Authenticator)
  // Format: otpauth://totp/{label}?secret={secret}&issuer={issuer}
  const label = encodeURIComponent(`منظومة العزب (${userId})`)
  const issuer = encodeURIComponent('Alazab SSO')
  const qrUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}`

  // Generate QR code using external service (we'll use data URL format)
  // In production, use a QR code library
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}`

  return {
    secret,
    qr_code: qrCodeUrl,
    manual_entry_key: secret,
    backup_codes: backupCodes,
  }
}

export async function enableTwoFA(userId: string, secret: string, code: string, backupCodes: string[]): Promise<boolean> {
  try {
    // Verify the code first
    if (!verifyTOTP(secret, code)) {
      return false
    }

    // Hash backup codes (in production, use bcrypt)
    const hashedCodes = backupCodes.map(code => 
      crypto.createHash('sha256').update(code).digest('hex')
    )

    // Save to database
    const { error } = await getSupabaseAdminClient()
      .from('two_fa_secrets')
      .upsert({
        user_id: userId,
        secret,
        backup_codes: hashedCodes,
        is_enabled: true,
        updated_at: new Date().toISOString(),
      })

    if (error) throw error

    // Log the action
    await getSupabaseAdminClient()
      .from('two_fa_log')
      .insert({
        user_id: userId,
        method: 'totp',
        status: 'success',
        created_at: new Date().toISOString(),
      })

    return true
  } catch (error) {
    console.error('[v0] Error enabling 2FA:', error)
    return false
  }
}

export async function verifyTwoFACode(userId: string, code: string): Promise<boolean> {
  try {
    // Get the 2FA secret
    const { data: twoFaData, error: fetchError } = await getSupabaseAdminClient()
      .from('two_fa_secrets')
      .select('secret, backup_codes, is_enabled')
      .eq('user_id', userId)
      .single()

    if (fetchError || !twoFaData || !twoFaData.is_enabled) {
      return false
    }

    let isValid = false

    // Check TOTP code
    if (verifyTOTP(twoFaData.secret, code)) {
      isValid = true
    }

    // Check backup code
    if (!isValid && twoFaData.backup_codes) {
      const codeHash = crypto.createHash('sha256').update(code).digest('hex')
      const backupCodeIndex = twoFaData.backup_codes.indexOf(codeHash)

      if (backupCodeIndex !== -1) {
        isValid = true
        // Remove used backup code
        const newBackupCodes = twoFaData.backup_codes.filter((_: string, i: number) => i !== backupCodeIndex)
        await getSupabaseAdminClient()
          .from('two_fa_secrets')
          .update({ backup_codes: newBackupCodes })
          .eq('user_id', userId)
      }
    }

    // Log the attempt
    await getSupabaseAdminClient()
      .from('two_fa_log')
      .insert({
        user_id: userId,
        method: code.length === 6 ? 'totp' : 'backup_code',
        status: isValid ? 'success' : 'failed',
        created_at: new Date().toISOString(),
      })

    return isValid
  } catch (error) {
    console.error('[v0] Error verifying 2FA code:', error)
    return false
  }
}

export async function disableTwoFA(userId: string): Promise<boolean> {
  try {
    const { error } = await getSupabaseAdminClient()
      .from('two_fa_secrets')
      .update({ is_enabled: false })
      .eq('user_id', userId)

    if (error) throw error

    await getSupabaseAdminClient()
      .from('two_fa_log')
      .insert({
        user_id: userId,
        method: 'totp',
        status: 'success',
        created_at: new Date().toISOString(),
      })

    return true
  } catch (error) {
    console.error('[v0] Error disabling 2FA:', error)
    return false
  }
}

export async function getTwoFAStatus(userId: string): Promise<{ enabled: boolean; codes_remaining: number }> {
  try {
    const { data, error } = await getSupabaseAdminClient()
      .from('two_fa_secrets')
      .select('is_enabled, backup_codes')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return { enabled: false, codes_remaining: 0 }
    }

    return {
      enabled: data.is_enabled || false,
      codes_remaining: data.backup_codes?.length || 0,
    }
  } catch (error) {
    console.error('[v0] Error getting 2FA status:', error)
    return { enabled: false, codes_remaining: 0 }
  }
}

export async function regenerateBackupCodes(userId: string): Promise<string[] | null> {
  try {
    const newCodes = generateBackupCodes()
    const hashedCodes = newCodes.map(code =>
      crypto.createHash('sha256').update(code).digest('hex')
    )

    const { error } = await getSupabaseAdminClient()
      .from('two_fa_secrets')
      .update({ backup_codes: hashedCodes })
      .eq('user_id', userId)

    if (error) throw error

    return newCodes
  } catch (error) {
    console.error('[v0] Error regenerating backup codes:', error)
    return null
  }
}
