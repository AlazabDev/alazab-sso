'use client'

import { useAuth } from '@/lib/auth/context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QuickStats } from '@/components/dashboard/quick-stats'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { ConnectedDevices } from '@/components/dashboard/connected-devices'
import axios from 'axios'

export default function DashboardPage() {
  const { user, isLoading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [isLoading, user, router])

  const handleSignOut = async () => {
    try {
      await axios.post('/api/auth/signout')
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">لوحة التحكم</h1>
            <p className="text-sm text-foreground/60 mt-1">أهلاً {user.email}</p>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            تسجيل الخروج
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Quick Stats */}
          <QuickStats />

          {/* Activity and Devices Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ActivityFeed limit={10} />
            </div>
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">معلومات الحساب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-foreground/60">البريد الإلكتروني</p>
                    <p className="font-mono text-sm text-foreground">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground/60">معرف المستخدم</p>
                    <p className="font-mono text-xs text-foreground break-all">{user.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground/60">آخر دخول</p>
                    <p className="text-sm text-foreground">
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleDateString('ar-SA')
                        : 'لا يوجد'}
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push('/settings')}
                    className="w-full mt-4"
                  >
                    الإعدادات
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Connected Devices */}
          <ConnectedDevices />
        </div>
      </main>
    </div>
  )
}
