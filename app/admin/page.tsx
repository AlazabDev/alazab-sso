'use client'

import { useEffect, useState } from 'react'
import { DashboardHeader } from '@/components/admin/dashboard-header'
import { StatsCards } from '@/components/admin/stats-cards'
import { ChartsOverview } from '@/components/admin/charts-overview'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardStats } from '@/lib/types/admin.types'

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/analytics')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('[v0] Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <DashboardHeader title="لوحة التحكم" description="ملخص شامل لأنشطة النظام" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="space-y-6 p-6">
        <DashboardHeader title="لوحة التحكم" description="ملخص شامل لأنشطة النظام" />
        <Card className="p-6 text-center text-muted-foreground">فشل تحميل البيانات الإحصائية</Card>
      </div>
    )
  }

  const successRate = stats.total_login_attempts > 0 ? (stats.successful_logins / stats.total_login_attempts) * 100 : 0

  return (
    <div className="space-y-6 p-6">
      <DashboardHeader title="لوحة التحكم" description="ملخص شامل لأنشطة النظام" />

      <StatsCards
        totalUsers={stats.total_users}
        totalLogins={stats.total_login_attempts}
        successfulLogins={stats.successful_logins}
        failedLogins={stats.failed_logins}
      />

      <ChartsOverview loginTrend={stats.login_trend} successRate={successRate} />

      {/* Recent Logins */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">آخر عمليات الدخول</h3>
        <div className="space-y-3">
          {stats.recent_logins.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد عمليات دخول حديثة</p>
          ) : (
            stats.recent_logins.slice(0, 5).map((login) => (
              <div key={login.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-foreground">{login.email}</p>
                  <p className="text-xs text-muted-foreground">{login.provider}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      login.status === 'success'
                        ? 'bg-green-500/20 text-green-600'
                        : 'bg-red-500/20 text-red-600'
                    }`}
                  >
                    {login.status === 'success' ? 'ناجح' : 'فاشل'}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(login.created_at).toLocaleString('ar-SA')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Providers Overview */}
      {stats.providers.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">وسائط المصادقة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.providers.map((provider, index) => (
              <div key={index} className="p-4 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-foreground">{provider.name}</h4>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      provider.is_active
                        ? 'bg-green-500/20 text-green-600'
                        : 'bg-gray-500/20 text-gray-600'
                    }`}
                  >
                    {provider.is_active ? 'مفعل' : 'معطل'}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">عمليات الدخول:</span>
                    <span className="font-medium">{provider.login_count.toLocaleString('ar-SA')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">معدل النجاح:</span>
                    <span className="font-medium text-green-600">{provider.success_rate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
