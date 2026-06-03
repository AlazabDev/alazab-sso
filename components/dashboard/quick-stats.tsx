'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'

interface QuickStatsProps {
  userId?: string
}

export function QuickStats({ userId }: QuickStatsProps) {
  const [stats, setStats] = useState({
    totalDevices: 0,
    activeDevices: 0,
    unreadNotifications: 0,
    lastLogin: '',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [devicesRes, notificationsRes] = await Promise.all([
          fetch('/api/user/devices'),
          fetch('/api/user/notifications?is_read=false&limit=1'),
        ])

        if (devicesRes.ok && notificationsRes.ok) {
          const devicesData = await devicesRes.json()
          const notificationsData = await notificationsRes.json()

          setStats({
            totalDevices: devicesData.devices?.length || 0,
            activeDevices: devicesData.devices?.filter((d: any) => d.last_activity_at).length || 0,
            unreadNotifications: notificationsData.total || 0,
            lastLogin: new Date().toLocaleDateString('ar-SA'),
          })
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statItems = [
    {
      label: 'الأجهزة المتصلة',
      value: stats.totalDevices,
      icon: '💻',
    },
    {
      label: 'الأجهزة النشطة',
      value: stats.activeDevices,
      icon: '🟢',
    },
    {
      label: 'الإخطارات غير المقروءة',
      value: stats.unreadNotifications,
      icon: '🔔',
    },
    {
      label: 'آخر دخول',
      value: stats.lastLogin,
      icon: '🕐',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item) => (
        <Card key={item.label} className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-foreground/60 mb-2">{item.label}</p>
              <p className="text-2xl font-bold text-foreground">
                {loading ? '-' : item.value}
              </p>
            </div>
            <span className="text-3xl">{item.icon}</span>
          </div>
        </Card>
      ))}
    </div>
  )
}
