'use client'

import { useState, useEffect } from 'react'
import {
  handleSendWhatsAppOtp,
  handleVerifyWhatsAppOtp,
  handleResendWhatsAppOtp,
} from '@/lib/services/auth.service'

interface WhatsAppOtpModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  onError?: (error: string) => void
}

type Step = 'phone' | 'otp'

export function WhatsAppOtpModal({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: WhatsAppOtpModalProps) {
  const [step, setStep] = useState<Step>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [countryCode, setCountryCode] = useState('+20') // Default to Egypt
  const [otpCode, setOtpCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState(0)

  // Resend timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [resendTimer])

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step === 'phone') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, step, onClose])

  if (!isOpen) return null

  const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/^\+/, '')}`

  const handleSendOtp = async () => {
    setError(null)

    // Validate phone
    if (!phoneNumber.trim()) {
      setError('رقم الهاتف مطلوب')
      return
    }

    setIsLoading(true)

    try {
      const result = await handleSendWhatsAppOtp(fullPhoneNumber)

      if (result.success) {
        setStep('otp')
        setResendTimer(60)
      } else {
        const errorMessage = result.error?.message || 'فشل إرسال رمز التحقق'
        setError(errorMessage)
        onError?.(errorMessage)
      }
    } catch (err) {
      const errorMessage = 'حدث خطأ في إرسال رمز التحقق'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setError(null)

    // Validate OTP
    if (otpCode.length !== 6) {
      setError('رمز التحقق يجب أن يكون 6 أرقام')
      return
    }

    setIsLoading(true)

    try {
      const result = await handleVerifyWhatsAppOtp(fullPhoneNumber, otpCode)

      if (result.success) {
        setOtpCode('')
        setPhoneNumber('')
        setStep('phone')
        onSuccess?.()
        onClose()
      } else {
        const errorMessage = result.error?.message || 'فشل التحقق من رمز التحقق'
        setError(errorMessage)
        onError?.(errorMessage)
      }
    } catch (err) {
      const errorMessage = 'حدث خطأ في التحقق'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const result = await handleResendWhatsAppOtp(fullPhoneNumber)

      if (result.success) {
        setResendTimer(60)
      } else {
        const errorMessage = result.error?.message || 'فشل إعادة الإرسال'
        setError(errorMessage)
        onError?.(errorMessage)
      }
    } catch (err) {
      const errorMessage = 'حدث خطأ في إعادة الإرسال'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackClick = () => {
    if (step === 'otp') {
      setOtpCode('')
      setError(null)
      setStep('phone')
    } else {
      onClose()
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => step === 'phone' && onClose()}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              {step === 'phone' ? 'تسجيل الدخول عبر WhatsApp' : 'التحقق من الرمز'}
            </h2>
            {step === 'phone' && (
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="إغلاق"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
            {step === 'otp' && (
              <button
                onClick={handleBackClick}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="رجوع"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Phone Input Step */}
          {step === 'phone' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                أدخل رقم هاتفك لتسجيل الدخول عبر WhatsApp
              </p>

              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-foreground">
                  رقم الهاتف
                </label>

                <div className="flex gap-2">
                  {/* Country Code */}
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    disabled={isLoading}
                    className="w-24 px-3 py-2.5 border border-input rounded-lg bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 transition-colors"
                  >
                    <option value="+20">🇪🇬 +20</option>
                    <option value="+966">🇸🇦 +966</option>
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+968">🇴🇲 +968</option>
                    <option value="+965">🇰🇼 +965</option>
                    <option value="+974">🇶🇦 +974</option>
                    <option value="+212">🇲🇦 +212</option>
                  </select>

                  {/* Phone Input */}
                  <input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="رقم الهاتف"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 border border-input rounded-lg bg-white text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  />
                </div>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={isLoading || !phoneNumber.trim()}
                className="w-full px-4 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  'إرسال رمز التحقق'
                )}
              </button>
            </div>
          )}

          {/* OTP Input Step */}
          {step === 'otp' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                تم إرسال رمز التحقق إلى <strong>{fullPhoneNumber}</strong>
              </p>

              <div className="space-y-2">
                <label htmlFor="otp" className="block text-sm font-medium text-foreground">
                  رمز التحقق (6 أرقام)
                </label>

                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    setOtpCode(val)

                    // Auto-submit when 6 digits are entered
                    if (val.length === 6) {
                      setTimeout(() => {
                        // Will be handled by submit button click
                      }, 100)
                    }
                  }}
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-input rounded-lg bg-white text-foreground text-center text-2xl tracking-widest placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-mono"
                />
              </div>

              {/* Resend Section */}
              <div className="text-center text-sm text-muted-foreground">
                {resendTimer > 0 ? (
                  <p>
                    إعادة الإرسال متاحة بعد{' '}
                    <span className="font-medium text-foreground">{resendTimer}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    disabled={isLoading || resendTimer > 0}
                    className="text-accent hover:text-accent/90 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    إعادة إرسال الرمز
                  </button>
                )}
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={isLoading || otpCode.length !== 6}
                className="w-full px-4 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  'تأكيد'
                )}
              </button>
            </div>
          )}

          {/* WhatsApp Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-xs text-center">
            سيتم إرسال رمز التحقق عبر WhatsApp
          </div>
        </div>
      </div>
    </>
  )
}
