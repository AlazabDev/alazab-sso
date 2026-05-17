'use client'

import { useLanguage } from '@/lib/i18n/context'
import { getAvailableLanguages } from '@/lib/i18n/translations'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()
  const languages = getAvailableLanguages()

  return (
    <Select value={language} onValueChange={(value) => setLanguage(value as 'en' | 'ar')}>
      <SelectTrigger className="w-[120px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
