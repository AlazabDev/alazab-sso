'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { UserActivityLog } from '@/lib/types/phase1.types'

interface ActivityFeedProps {
  userId?: string
  limit?: number
}

export function ActivityFeed({ userId, limit = 10 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<UserActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/user/activity?limit=${limit}`)

        if (!response.ok) {
          throw new Error('Failed to fetch activities')
        }

        const data = await response.json()
        setActivities(data.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [limit])

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'login':
        return '🔐'
      case 'logout':
        return '🚪'
      case 'settings_change':
        return '⚙️'
      case 'device_add':
        return '➕'
      case 'device_remove':
        return '➖'
      case 'password_change':
        return '🔑'
      case 'profile_update':
        return '👤'
      default:
        return '📝'
    }
  }

  const getActivityDescription = (activity: UserActivityLog) => {
    switch (activity.action_type) {
      case 'login':
        return 'تسجيل دخول'
      case 'logout':
        return 'تسجيل خروج'
      case 'settings_change':
        return 'تغيير الإعدادات'
      case 'device_add':
        return 'إضافة جهاز جديد'
      case 'device_remove':
        return 'حذف جهاز'
      case 'password_change':
        return 'تغيير كلمة المرور'
      case 'profile_update':
        return 'تحديث الملف الشخصي'
      default:
        return activity.action
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'الآن'
    if (diffMins < 60) return `قبل ${diffMins} دقيقة`
    if (diffHours < 24) return `قبل ${diffHours} ساعة`
    if (diffDays < 7) return `قبل ${diffDays} يوم`
    
    return date.toLocaleDateString('ar-SA')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">سجل الأنشطة الأخيرة</CardTitle>
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
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-foreground/60">لا توجد أنشطة</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 pb-4 border-b last:border-b-0 last:pb-0"
              >
                <div className="text-2xl mt-1">
                  {getActivityIcon(activity.action_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">
                    {getActivityDescription(activity)}
                  </p>
                  {activity.description && (
                    <p className="text-sm text-foreground/60">
                      {activity.description}
                    </p>
                  )}
                  <p className="text-xs text-foreground/40 mt-1">
                    {formatDate(activity.created_at)}
                  </p>
                </div>
                <div className="flex items-center">
                  {activity.status === 'success' ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-red-600">✕</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activities.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <Button variant="outline" className="w-full">
              عرض جميع الأنشطة
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
