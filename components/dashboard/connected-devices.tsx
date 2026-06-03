'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { UserDevice } from '@/lib/types/phase1.types'

interface ConnectedDevicesProps {
  userId?: string
}

export function ConnectedDevices({ userId }: ConnectedDevicesProps) {
  const [devices, setDevices] = useState<UserDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

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

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'mobile':
        return '📱'
      case 'desktop':
        return '🖥️'
      case 'tablet':
        return '📱'
      case 'web':
        return '🌐'
      default:
        return '💻'
    }
  }

  const handleRemoveDevice = async (deviceId: string) => {
    if (!confirm('هل تريد حذف هذا الجهاز؟')) return

    try {
      setRemovingId(deviceId)
      const response = await fetch('/api/user/devices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete device')
      }

      setDevices(devices.filter(d => d.id !== deviceId))
    } catch (err) {
      console.error('Error removing device:', err)
    } finally {
      setRemovingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">الأجهزة المتصلة</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <p className="text-foreground/60">جاري التحميل...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive">{error}</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-foreground/60">لا توجد أجهزة</p>
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex items-start justify-between gap-4 pb-4 border-b last:border-b-0 last:pb-0"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-2xl mt-1">
                    {getDeviceIcon(device.device_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">
                      {device.device_name}
                    </p>
                    <div className="text-sm text-foreground/60 space-y-1 mt-1">
                      {device.browser_name && (
                        <p>{device.browser_name} {device.browser_version}</p>
                      )}
                      {device.device_os && (
                        <p>{device.device_os}</p>
                      )}
                      {device.ip_address && (
                        <p>IP: {device.ip_address}</p>
                      )}
                      <p className="text-xs text-foreground/40">
                        آخر نشاط: {device.last_activity_at ? formatDate(device.last_activity_at) : 'لا يوجد'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {device.is_trusted && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      موثوق
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDevice(device.id)}
                    disabled={removingId === device.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {removingId === device.id ? 'جاري الحذف...' : 'حذف'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
