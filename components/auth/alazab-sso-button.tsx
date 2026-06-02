'use client'

import { useState } from 'react'
import { handleAlazabSsoLogin } from '@/lib/services/auth.service'

interface AlazabSsoButtonProps {
  onLoading?: (isLoading: boolean) => void
  onError?: (error: string) => void
}

export function AlazabSsoButton({ onLoading, onError }: AlazabSsoButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    onLoading?.(true)

    try {
      const result = await handleAlazabSsoLogin()
      if (!result.success && result.error) {
        onError?.(result.error.message)
        setIsLoading(false)
        onLoading?.(false)
      }
    } catch (error) {
      onError?.('حدث خطأ غير متوقع')
      setIsLoading(false)
      onLoading?.(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      aria-label="الدخول بحساب العزب"
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          <span>جاري التحويل...</span>
        </>
      ) : (
        <>
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
          </svg>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">الدخول بحساب العزب</span>
            <span className="text-xs opacity-90">مخصص لموظفي وإدارة الشركة</span>
          </div>
        </>
      )}
    </button>
  )
}
