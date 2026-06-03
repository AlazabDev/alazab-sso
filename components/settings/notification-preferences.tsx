'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import type { NotificationPreferences } from '@/lib/types/phase1.types'

interface NotificationPreferencesProps {
  userId?: string
}

export function NotificationPreferencesComponent({ userId }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/user/notification-preferences')

        if (!response.ok) {
          throw new Error('Failed to fetch preferences')
        }

        const data = await response.json()
        setPreferences(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchPreferences()
  }, [])

  const handleToggle = async (field: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return

    const updated = { ...preferences, [field]: value }
    setPreferences(updated)

    try {
      setSaving(true)
      const response = await fetch('/api/user/notification-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })

      if (!response.ok) {
        throw new Error('Failed to save preferences')
      }
    } catch (err) {
      console.error('Error saving preferences:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      // Revert change
      setPreferences({ ...preferences, [field]: !value })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>جاري التحميل...</div>
  }

  if (!preferences) {
    return <div>حدث خطأ في تحميل التفضيلات</div>
  }

  return (
    <div className="space-y-6">
      {/* In-App Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>إخطارات التطبيق</CardTitle>
          <CardDescription>اختر أنواع الإخطارات التي تريد استقبالها في التطبيق</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-foreground">إخطارات الدخول</label>
            <Switch
              checked={preferences.login_notifications}
              onCheckedChange={(v) => handleToggle('login_notifications', v)}
              disabled={saving}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-foreground">إخطارات الأمان</label>
            <Switch
              checked={preferences.security_notifications}
              onCheckedChange={(v) => handleToggle('security_notifications', v)}
              disabled={saving}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-foreground">إخطارات الحساب</label>
            <Switch
              checked={preferences.account_notifications}
              onCheckedChange={(v) => handleToggle('account_notifications', v)}
              disabled={saving}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-foreground">إخطارات النظام</label>
            <Switch
              checked={preferences.system_notifications}
              onCheckedChange={(v) => handleToggle('system_notifications', v)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>إخطارات البريد الإلكتروني</CardTitle>
          <CardDescription>اختر أنواع الإخطارات التي تريد استقبالها عبر البريد الإلكتروني</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-foreground">إخطارات الدخول</label>
            <Switch
              checked={preferences.email_login}
              onCheckedChange={(v) => handleToggle('email_login', v)}
              disabled={saving}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-foreground">إخطارات الأمان</label>
            <Switch
              checked={preferences.email_security}
              onCheckedChange={(v) => handleToggle('email_security', v)}
              disabled={saving}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-foreground">إخطارات الحساب</label>
            <Switch
              checked={preferences.email_account}
              onCheckedChange={(v) => handleToggle('email_account', v)}
              disabled={saving}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-foreground">إخطارات النظام</label>
            <Switch
              checked={preferences.email_system}
              onCheckedChange={(v) => handleToggle('email_system', v)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
