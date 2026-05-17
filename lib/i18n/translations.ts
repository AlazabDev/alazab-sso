import en from '@/locales/en.json'
import ar from '@/locales/ar.json'

export type Language = 'en' | 'ar'

const translations: Record<Language, typeof en> = {
  en,
  ar,
}

/**
 * Get translation string with optional interpolation
 */
export function t(
  language: Language,
  key: string,
  variables?: Record<string, string | number>
): string {
  const keys = key.split('.')
  let value: any = translations[language]

  for (const k of keys) {
    value = value?.[k]
    if (!value) break
  }

  if (!value || typeof value !== 'string') {
    // Fallback to English
    value = key.split('.').reduce((obj: any, k) => obj?.[k], translations.en)
    if (!value || typeof value !== 'string') {
      return key
    }
  }

  // Replace variables
  if (variables) {
    let result = value
    for (const [varKey, varValue] of Object.entries(variables)) {
      result = result.replace(`{{${varKey}}}`, String(varValue))
    }
    return result
  }

  return value
}

/**
 * Determine if language is RTL
 */
export function isRTL(language: Language): boolean {
  return language === 'ar'
}

/**
 * Get language direction
 */
export function getDirection(language: Language): 'rtl' | 'ltr' {
  return isRTL(language) ? 'rtl' : 'ltr'
}

/**
 * Get current language from localStorage or browser
 */
export function getPreferredLanguage(): Language {
  if (typeof window === 'undefined') return 'en'

  // Check localStorage first
  const stored = localStorage.getItem('language')
  if (stored === 'ar' || stored === 'en') {
    return stored
  }

  // Check browser language
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('ar')) {
    return 'ar'
  }

  return 'en'
}

/**
 * Save language preference
 */
export function setPreferredLanguage(language: Language): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', language)
  }
}

/**
 * Get all available languages
 */
export function getAvailableLanguages(): { code: Language; name: string }[] {
  return [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'العربية' },
  ]
}
