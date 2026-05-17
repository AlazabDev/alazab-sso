# Bilingual Support (Arabic/English)

This document explains how the bilingual support system works in the SSO application.

## Overview

The application supports both English (English) and Arabic (العربية) with full RTL (Right-to-Left) support for Arabic.

## Architecture

### Translation Files

Translations are stored in JSON files in the `locales/` directory:

- `locales/en.json` - English translations
- `locales/ar.json` - Arabic translations

Both files have the same structure with identical keys.

### Language Context

The `LanguageProvider` wraps the entire application and provides:
- Current language state
- Language switching functionality
- RTL/LTR direction detection
- Persistent language preferences

### i18n Utilities

Located in `lib/i18n/`:
- `translations.ts` - Core translation functions
- `context.tsx` - React context and hooks

## Usage

### Using Translations in Components

```typescript
'use client'

import { useTranslation } from '@/lib/i18n/context'

export function MyComponent() {
  const { t } = useTranslation()

  return <h1>{t('common.appName')}</h1>
}
```

### With Variables

```typescript
const message = t('auth.signInWith', { provider: 'Google' })
// Output: "Sign in with Google" or "سجل دخولك باستخدام جوجل"
```

### Changing Language

```typescript
'use client'

import { useLanguage } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/language-switcher'

export function Header() {
  const { language, setLanguage } = useLanguage()

  return (
    <div>
      <LanguageSwitcher />
      <p>Current language: {language}</p>
    </div>
  )
}
```

### Direct Translation Function

```typescript
import { t, isRTL, getDirection } from '@/lib/i18n/translations'

const enGreeting = t('en', 'common.appName')
const arGreeting = t('ar', 'common.appName')
const isArabic = isRTL('ar') // true
const direction = getDirection('ar') // 'rtl'
```

## Translation File Structure

```json
{
  "category": {
    "key": "Translation text",
    "keyWithVariable": "Text with {{variable}}"
  }
}
```

### Current Translation Categories

1. **common** - Common words and actions
2. **auth** - Authentication-related strings
3. **provider** - OAuth provider names
4. **userType** - User type options
5. **dashboard** - Dashboard page strings
6. **settings** - Settings page strings
7. **errors** - Error messages
8. **validation** - Validation messages

## RTL Support

### Automatic Direction

The HTML `dir` attribute is automatically set based on the current language:

```html
<!-- English -->
<html lang="en" dir="ltr">

<!-- Arabic -->
<html lang="ar" dir="rtl">
```

### Tailwind CSS RTL Support

Use Tailwind's `rtl:` prefix for RTL-specific styles:

```tsx
<div className="ml-4 rtl:ml-0 rtl:mr-4">
  // Left margin on LTR, right margin on RTL
</div>
```

### Flexbox Direction

For flexbox layouts, use direction utilities:

```tsx
<div className="flex flex-row rtl:flex-row-reverse">
  // Reverses flex direction in RTL
</div>
```

## Browser Language Detection

On first load, the application:
1. Checks `localStorage` for saved language preference
2. Falls back to browser language if available
3. Defaults to English

```typescript
const preferred = getPreferredLanguage()
// Returns: 'en' or 'ar'
```

## Language Persistence

User language preference is saved to `localStorage`:

```typescript
setPreferredLanguage('ar')
// Later...
const saved = getPreferredLanguage() // 'ar'
```

## Adding New Translations

### Step 1: Add to Both JSON Files

**locales/en.json**
```json
{
  "category": {
    "newKey": "English text"
  }
}
```

**locales/ar.json**
```json
{
  "category": {
    "newKey": "النص العربي"
  }
}
```

### Step 2: Use in Component

```typescript
const { t } = useTranslation()
const text = t('category.newKey')
```

## Translation Best Practices

1. **Key Naming**: Use dot notation for hierarchy
   ```
   ✓ auth.signIn.title
   ✗ AuthSignInTitle
   ```

2. **Consistency**: Use same keys across all languages
   ```
   ✓ Both en.json and ar.json have same structure
   ✗ Different keys or missing translations
   ```

3. **Variables**: Use {{variable}} format
   ```
   ✓ "Sign in with {{provider}}"
   ✗ "Sign in with {provider}"
   ```

4. **Contextual**: Translate in context, not word-by-word
   ```
   ✓ "Email" → "البريد الإلكتروني"
   ✗ "Electronic mail"
   ```

5. **Length**: Account for longer Arabic text
   ```
   English: "Sign In"
   Arabic: "تسجيل الدخول" (longer)
   ```

## Component Examples

### Language Switcher

```typescript
import { LanguageSwitcher } from '@/components/language-switcher'

export function Header() {
  return (
    <header className="flex justify-between items-center">
      <h1>App Title</h1>
      <LanguageSwitcher />
    </header>
  )
}
```

### Translated Login Form

```typescript
'use client'

import { useTranslation } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'

export function LoginForm() {
  const { t } = useTranslation()

  return (
    <form>
      <h1>{t('auth.signIn')}</h1>
      <input placeholder={t('common.email')} />
      <Button>{t('auth.signIn')}</Button>
    </form>
  )
}
```

### Conditional RTL Styling

```typescript
'use client'

import { useLanguage } from '@/lib/i18n/context'

export function Card() {
  const { direction } = useLanguage()

  return (
    <div
      className="p-4"
      style={{
        textAlign: direction === 'rtl' ? 'right' : 'left',
      }}
    >
      Content
    </div>
  )
}
```

## Fallback Behavior

If a translation key is missing:
1. Attempts to find it in the current language
2. Falls back to English version
3. Returns the key itself if not found

This prevents blank text or errors.

## Testing Translations

### Manual Testing

1. Start app: `pnpm dev`
2. Open browser DevTools Console
3. Set language:
   ```javascript
   localStorage.setItem('language', 'ar')
   location.reload()
   ```

### Verify RTL

Check that:
- HTML `dir="rtl"` when language is Arabic
- Flexbox direction reverses properly
- Text aligns right in Arabic mode
- No layout breaks in RTL

## Common Issues

### Missing Translations

**Problem**: Some text doesn't change when language changes

**Solution**: 
- Check translation key exists in both JSON files
- Verify component uses `useTranslation()` hook
- Check browser console for errors

### RTL Layout Breaks

**Problem**: Layout looks broken in Arabic mode

**Solution**:
- Use `rtl:` Tailwind classes
- Don't use hardcoded left/right values
- Test both LTR and RTL before deploying

### Language Not Persisting

**Problem**: Language resets after page reload

**Solution**:
- Check `localStorage` is enabled
- Verify `setPreferredLanguage()` is called
- Check browser doesn't have storage disabled

## Expanding to More Languages

To add a new language (e.g., French):

### 1. Create Translation File

```json
// locales/fr.json
{
  "common": {
    "appName": "Système SSO"
  }
  // ... rest of translations
}
```

### 2. Update translations.ts

```typescript
import fr from '@/locales/fr.json'

export type Language = 'en' | 'ar' | 'fr'

const translations: Record<Language, typeof en> = {
  en,
  ar,
  fr,
}
```

### 3. Update Available Languages

```typescript
export function getAvailableLanguages() {
  return [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'العربية' },
    { code: 'fr', name: 'Français' },
  ]
}
```

### 4. Handle RTL if Needed

```typescript
export function isRTL(language: Language): boolean {
  return language === 'ar' || language === 'he' // Hebrew also RTL
}
```

## Performance Considerations

- Translations are loaded at build time (in JSON files)
- No runtime translation API calls
- Language switching is instant (just state update)
- JSON files are small (~10KB each)

## Accessibility

- Language preference is easily accessible
- Screen readers announce language changes
- Language switcher component is keyboard accessible
- Text direction changes are semantic (HTML `dir` attribute)

## Future Enhancements

Possible improvements:
1. Lazy load translation JSON files
2. Add professional translation service API
3. Implement language auto-detection
4. Add translation management UI
5. Support for date/time localization
6. Currency and number formatting
7. Pluralization rules

## References

- [IETF Language Tags](https://www.rfc-editor.org/rfc/bcp47.txt)
- [MDN: HTML dir attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dir)
- [Material Design RTL](https://material.io/design/platform-guidance/android-bars.html#behavior)
- [Next.js Internationalization](https://nextjs.org/docs/advanced-features/i18n-routing)
