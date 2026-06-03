'use client'

import { useAuth } from '@/lib/auth/context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import type { Notification } from '@/lib/types/phase1.types'

export default function NotificationsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())
  const [pageLoading, setPageLoading] = useState(true)
  const [limit, setLimit] = useState(20)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [isLoading, user, router])

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user, limit, offset])

  const fetchNotifications = async () => {
    try {
      setPageLoading(true)
      const response = await fetch(
        `/api/user/notifications?limit=${limit}&offset=${offset}`
      )
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.data || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setPageLoading(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNotifications(new Set(notifications.map((n) => n.id)))
    } else {
      setSelectedNotifications(new Set())
    }
  }

  const handleSelectNotification = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedNotifications)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedNotifications(newSelected)
  }

  const handleMarkAsRead = async (notificationId?: string) => {
    try {
      if (notificationId) {
        // Mark single as read
        const response = await fetch('/api/user/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notificationId,
            action: 'mark_as_read',
          }),
        })

        if (response.ok) {
          setNotifications(
            notifications.map((n) =>
              n.id === notificationId ? { ...n, is_read: true } : n
            )
          )
        }
      } else {
        // Mark all as read
        const response = await fetch('/api/user/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'mark_all_as_read',
          }),
        })

        if (response.ok) {
          setNotifications(notifications.map((n) => ({ ...n, is_read: true })))
          setSelectedNotifications(new Set())
        }
      }
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId,
          action: 'delete',
        }),
      })

      if (response.ok) {
        setNotifications(notifications.filter((n) => n.id !== notificationId))
        setSelectedNotifications(
          new Set([...selectedNotifications].filter((id) => id !== notificationId))
        )
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'login':
        return '🔐'
      case 'security':
        return '⚠️'
      case 'account':
        return '👤'
      case 'admin':
        return '👨‍💼'
      case 'system':
        return '⚙️'
      default:
        return '📢'
    }
  }

  if (isLoading || pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-foreground/60">جاري التحميل...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const hasMorePages = offset + limit < total
  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">الإخطارات</h1>
            <p className="text-sm text-foreground/60 mt-1">
              {unreadCount > 0 ? `${unreadCount} إخطار غير مقروء` : 'جميع الإخطارات مقروءة'}
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
          >
            العودة
          </Button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-foreground/60 text-lg">لا توجد إخطارات</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
              <Checkbox
                checked={selectedNotifications.size === notifications.length}
                onCheckedChange={(checked) =>
                  handleSelectAll(checked as boolean)
                }
              />
              <span className="text-sm text-foreground/60">
                {selectedNotifications.size > 0
                  ? `${selectedNotifications.size} محدد`
                  : 'تحديد الكل'}
              </span>
              {selectedNotifications.size > 0 && (
                <div className="flex gap-2 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAsRead()}
                  >
                    وضع علامة كمقروء
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      selectedNotifications.forEach((id) => handleDelete(id))
                    }}
                  >
                    حذف
                  </Button>
                </div>
              )}
            </div>

            {/* Notifications List */}
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`${!notification.is_read ? 'bg-accent/5' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Checkbox
                      checked={selectedNotifications.has(notification.id)}
                      onCheckedChange={(checked) =>
                        handleSelectNotification(notification.id, checked as boolean)
                      }
                    />
                    <span className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.notification_type)}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {notification.title}
                          </h3>
                          <p className="text-sm text-foreground/60 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-foreground/40 mt-2">
                            {new Date(notification.created_at).toLocaleString('ar-SA')}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                            جديد
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          قراءة
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(notification.id)}
                      >
                        حذف
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            <div className="flex justify-between items-center pt-4">
              <Button
                variant="outline"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - limit))}
              >
                السابق
              </Button>
              <span className="text-sm text-foreground/60">
                {offset + 1}-{Math.min(offset + limit, total)} من {total}
              </span>
              <Button
                variant="outline"
                disabled={!hasMorePages}
                onClick={() => setOffset(offset + limit)}
              >
                التالي
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
