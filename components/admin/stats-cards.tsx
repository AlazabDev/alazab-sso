'use client'

import { Card } from '@/components/ui/card'
import { Users, LogIn, CheckCircle, XCircle } from 'lucide-react'

interface StatsCardsProps {
  totalUsers: number
  totalLogins: number
  successfulLogins: number
  failedLogins: number
}

const stats = [
  {
    label: 'إجمالي المستخدمين',
    icon: Users,
    color: 'bg-blue-500/10 text-blue-500',
    key: 'totalUsers' as keyof StatsCardsProps,
  },
  {
    label: 'محاولات الدخول',
    icon: LogIn,
    color: 'bg-purple-500/10 text-purple-500',
    key: 'totalLogins' as keyof StatsCardsProps,
  },
  {
    label: 'الدخول الناجح',
    icon: CheckCircle,
    color: 'bg-green-500/10 text-green-500',
    key: 'successfulLogins' as keyof StatsCardsProps,
  },
  {
    label: 'الدخول الفاشل',
    icon: XCircle,
    color: 'bg-red-500/10 text-red-500',
    key: 'failedLogins' as keyof StatsCardsProps,
  },
]

export function StatsCards(data: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        const value = data[stat.key]

        return (
          <Card key={stat.key} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-foreground mt-2">{value.toLocaleString('ar-SA')}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
