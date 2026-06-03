'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { UserDevice } from '@/lib/types/phase1.types'

interface SessionManagerProps {
  userId?: string
}

export function SessionManager({ userId }: SessionManagerProps) {
  const [devices, setDevices] = useState<UserDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/user/devices')

        if (!response.ok) {
          throw new Error('Failed to fetch devices')
        }

        const data = await response.json()
        setDevices(data.devices || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchDevices()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleLogoutAll = async () => {
    if (!confirm('هل تريد تسجيل الخروج من جميع الأجهزة؟')) return
    // Implementation for logout all
    console.log('Logging out from all devices...')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>إدارة الجلسات</CardTitle>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogoutAll}
            disabled={devices.length === 0}
          >
            تسجيل خروج من الجميع
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-foreground/60">جاري التحميل...</p>
        ) : error ? (
          <p className="text-destructive">{error}</p>
        ) : devices.length === 0 ? (
          <p className="text-foreground/60">لا توجد جلسات نشطة</p>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex items-start justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">
                    {device.device_name}
                  </h4>
                  <div className="text-sm text-foreground/60 mt-2 space-y-1">
                    {device.device_os && <p>نظام التشغيل: {device.device_os}</p>}
                    {device.browser_name && (
                      <p>المتصفح: {device.browser_name} {device.browser_version}</p>
                    )}
                    {device.ip_address && <p>IP: {device.ip_address}</p>}
                    {device.last_activity_at && (
                      <p>آخر نشاط: {formatDate(device.last_activity_at)}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  تسجيل خروج
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
