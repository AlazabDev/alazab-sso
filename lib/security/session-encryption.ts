import crypto from 'crypto'

const ENCRYPTION_ALGORITHM = 'aes-256-gcm'
const ENCODING = 'hex'

export interface EncryptedSession {
  encrypted: string
  iv: string
  authTag: string
  salt: string
}

export interface SessionData {
  userId: string
  email: string
  provider: string
  accessToken: string
  refreshToken: string
  expiresAt: number
  createdAt: number
  ipAddress: string
  userAgent: string
}

class SessionEncryptor {
  private encryptionKey: Buffer

  constructor(masterKey?: string) {
    if (!masterKey) {
      const keyEnv = process.env.SESSION_ENCRYPTION_KEY
      if (!keyEnv) {
        throw new Error('SESSION_ENCRYPTION_KEY environment variable is required')
      }
      masterKey = keyEnv
    }

    // Derive a key from the master key using PBKDF2
    this.encryptionKey = crypto
      .pbkdf2Sync(masterKey, 'session-encryption', 32, 32, 'sha256')
  }

  encrypt(sessionData: SessionData): EncryptedSession {
    const salt = crypto.randomBytes(16)
    const iv = crypto.randomBytes(16)
    const key = crypto.pbkdf2Sync(this.encryptionKey, salt, 32, 32, 'sha256')

    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv)
    const plaintext = JSON.stringify(sessionData)

    let encrypted = cipher.update(plaintext, 'utf8', ENCODING)
    encrypted += cipher.final(ENCODING)

    const authTag = cipher.getAuthTag()

    return {
      encrypted,
      iv: iv.toString(ENCODING),
      authTag: authTag.toString(ENCODING),
      salt: salt.toString(ENCODING),
    }
  }

  decrypt(encryptedSession: EncryptedSession): SessionData {
    try {
      const salt = Buffer.from(encryptedSession.salt, ENCODING)
      const iv = Buffer.from(encryptedSession.iv, ENCODING)
      const authTag = Buffer.from(encryptedSession.authTag, ENCODING)

      const key = crypto.pbkdf2Sync(this.encryptionKey, salt, 32, 32, 'sha256')

      const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv)
      decipher.setAuthTag(authTag)

      let decrypted = decipher.update(encryptedSession.encrypted, ENCODING, 'utf8')
      decrypted += decipher.final('utf8')

      return JSON.parse(decrypted) as SessionData
    } catch (error) {
      throw new Error('Failed to decrypt session: invalid or tampered data')
    }
  }

  createSessionCookie(
    sessionData: SessionData,
    maxAge: number = 86400
  ): string {
    const encrypted = this.encrypt(sessionData)
    const cookieValue = JSON.stringify(encrypted)
    const encoded = Buffer.from(cookieValue).toString('base64')

    return encoded
  }

  parseSessionCookie(cookieValue: string): SessionData {
    try {
      const decoded = Buffer.from(cookieValue, 'base64').toString('utf8')
      const encryptedSession = JSON.parse(decoded) as EncryptedSession
      return this.decrypt(encryptedSession)
    } catch (error) {
      throw new Error('Failed to parse session cookie')
    }
  }

  isSessionExpired(sessionData: SessionData): boolean {
    return Date.now() > sessionData.expiresAt
  }

  validateSessionIntegrity(sessionData: SessionData): boolean {
    // Check required fields
    const requiredFields = [
      'userId',
      'email',
      'provider',
      'accessToken',
      'expiresAt',
      'createdAt',
    ]
    return requiredFields.every((field) => field in sessionData)
  }
}

export const sessionEncryptor = new SessionEncryptor()
