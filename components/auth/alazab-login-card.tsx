'use client'

import { useState } from 'react'
import { SocialLoginButtons } from './social-login-buttons'
import { EmailLoginForm } from './email-login-form'
import { AlazabSsoButton } from './alazab-sso-button'
import { DividerText } from './divider-text'
import { WhatsAppOtpModal } from './whatsapp-otp-modal'

type AuthMethod = 'social' | 'email' | 'sso'

interface AlazabLoginCardProps {
  onSuccess?: () => void
}

export function AlazabLoginCard({ onSuccess }: AlazabLoginCardProps) {
  const [authMethod, setAuthMethod] = useState<AuthMethod>('social')
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)

  const handleError = (error: string) => {
    setGlobalError(error)
    setTimeout(() => setGlobalError(null), 5000)
  }

  return (
    <>
      {/* Login Card */}
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 space-y-6 geometric-pattern relative">
        {/* Alazab Logo */}
        <div className="flex justify-center mb-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary text-primary-foreground rounded-full font-bold text-2xl">
            ع
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">منظومة العزب</h1>
          <p className="text-sm text-muted-foreground">الدخول الموحد الآمن</p>
        </div>

        {/* Global Error */}
        {globalError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
            {globalError}
          </div>
        )}

        {/* Auth Method Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => {
              setAuthMethod('social')
              setGlobalError(null)
            }}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              authMethod === 'social'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            وسائل أخرى
          </button>
          <button
            onClick={() => {
              setAuthMethod('email')
              setGlobalError(null)
            }}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              authMethod === 'email'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            بريد إلكتروني
          </button>
          <button
            onClick={() => {
              setAuthMethod('sso')
              setGlobalError(null)
            }}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              authMethod === 'sso'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            موظف
          </button>
        </div>

        {/* Social Auth Method */}
        {authMethod === 'social' && (
          <div className="space-y-4">
            <SocialLoginButtons
              onError={handleError}
              onLoading={(isLoading) => {
                if (isLoading) setGlobalError(null)
              }}
            />

            <DividerText text="أو تسجيل الدخول عبر WhatsApp" />

            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.869 1.176l-.348.192-3.61-.094 1.83 3.45.233.364a9.86 9.86 0 001.405 3.127 9.8 9.8 0 006.363 4.026l.335.067a9.864 9.864 0 004.872-.235l.348-.192 3.61.094-1.831-3.451-.234-.363a9.873 9.873 0 00-1.404-3.128 9.797 9.797 0 00-6.363-4.027l-.336-.067a9.864 9.864 0 00-4.872.235" />
              </svg>
              تسجيل الدخول عبر WhatsApp
            </button>
          </div>
        )}

        {/* Email Auth Method */}
        {authMethod === 'email' && (
          <EmailLoginForm
            onSuccess={() => {
              setGlobalError(null)
              onSuccess?.()
            }}
            onError={handleError}
          />
        )}

        {/* SSO Auth Method */}
        {authMethod === 'sso' && (
          <div className="space-y-4">
            <AlazabSsoButton
              onError={handleError}
              onLoading={(isLoading) => {
                if (isLoading) setGlobalError(null)
              }}
            />
            <p className="text-xs text-muted-foreground text-center">
              سيتم تحويلك إلى منظومة الدخول الموحد لموظفي العزب
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground border-t border-border pt-4">
          <p>
            بمتابعتك، أنت توافق على{' '}
            <a href="/terms" className="text-accent hover:underline">
              شروط الاستخدام
            </a>{' '}
            و{' '}
            <a href="/privacy" className="text-accent hover:underline">
              سياسة الخصوصية
            </a>
          </p>
        </div>
      </div>

      {/* WhatsApp OTP Modal */}
      <WhatsAppOtpModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        onSuccess={() => {
          setShowWhatsAppModal(false)
          onSuccess?.()
        }}
        onError={handleError}
      />
    </>
  )
}
