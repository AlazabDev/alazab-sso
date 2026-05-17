'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Language } from '@/lib/i18n/translations'
import { getPreferredLanguage, setPreferredLanguage, getDirection, isRTL } from '@/lib/i18n/translations'

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  direction: 'rtl' | 'ltr'
  isRTL: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Get preferred language on mount
    const preferred = getPreferredLanguage()
    setLanguageState(preferred)

    // Set HTML dir attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = preferred
      document.documentElement.dir = getDirection(preferred)
    }

    setIsLoaded(true)
  }, [])

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage)
    setPreferredLanguage(newLanguage)

    // Update HTML attributes
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLanguage
      document.documentElement.dir = getDirection(newLanguage)
    }
  }

  if (!isLoaded) {
    return <>{children}</>
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        direction: getDirection(language),
        isRTL: isRTL(language),
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

/**
 * Custom hook for translations
 */
export function useTranslation() {
  const { language } = useLanguage()
  const { t } = require('@/lib/i18n/translations')

  return {
    t: (key: string, variables?: Record<string, string | number>) =>
      t(language, key, variables),
    language,
  }
}
