'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { handleEmailLogin } from '@/lib/services/auth.service'

// Zod validation schema
const emailLoginSchema = z.object({
  email: z.string()
    .min(1, 'البريد الإلكتروني مطلوب')
    .email('البريد الإلكتروني غير صحيح'),
  password: z.string()
    .min(1, 'كلمة المرور مطلوبة')
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
})

type EmailLoginFormData = z.infer<typeof emailLoginSchema>

interface EmailLoginFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function EmailLoginForm({ onSuccess, onError }: EmailLoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EmailLoginFormData>({
    resolver: zodResolver(emailLoginSchema),
  })

  const onSubmit = async (data: EmailLoginFormData) => {
    setIsLoading(true)
    setServerError(null)

    try {
      const result = await handleEmailLogin(data.email, data.password)

      if (result.success) {
        reset()
        onSuccess?.()
      } else {
        const errorMessage = result.error?.message || 'فشل تسجيل الدخول'
        setServerError(errorMessage)
        onError?.(errorMessage)
      }
    } catch (error) {
      const errorMessage = 'حدث خطأ غير متوقع'
      setServerError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Server Error */}
      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {serverError}
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          البريد الإلكتروني
        </label>
        <input
          id="email"
          type="email"
          placeholder="example@email.com"
          {...register('email')}
          disabled={isLoading}
          className="w-full px-4 py-2.5 border border-input rounded-lg bg-white text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            كلمة المرور
          </label>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-sm text-accent hover:text-accent/90 transition-colors"
            aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          >
            {showPassword ? 'إخفاء' : 'إظهار'}
          </button>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="أدخل كلمة المرور"
            {...register('password')}
            disabled={isLoading}
            className="w-full px-4 py-2.5 border border-input rounded-lg bg-white text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
        </div>
        {errors.password && (
          <p id="password-error" className="text-sm text-red-600">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Forgot Password Link */}
      <div className="text-right">
        <a
          href="/forgot-password"
          className="text-sm text-accent hover:text-accent/90 transition-colors"
        >
          هل نسيت كلمة المرور؟
        </a>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            جاري المعالجة...
          </>
        ) : (
          'تسجيل الدخول'
        )}
      </button>

      {/* Sign Up Link */}
      <div className="text-center text-sm text-muted-foreground">
        ليس لديك حساب؟{' '}
        <a
          href="/signup"
          className="text-accent hover:text-accent/90 font-medium transition-colors"
        >
          إنشاء حساب جديد
        </a>
      </div>
    </form>
  )
}
