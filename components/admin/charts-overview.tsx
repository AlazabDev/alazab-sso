'use client'

import { Card } from '@/components/ui/card'

interface LoginTrend {
  date: string
  count: number
  successful: number
  failed: number
}

interface ChartsOverviewProps {
  loginTrend: LoginTrend[]
  successRate: number
}

export function ChartsOverview({ loginTrend, successRate }: ChartsOverviewProps) {
  const maxCount = Math.max(...loginTrend.map(d => d.count), 1)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
      {/* Success Rate */}
      <Card className="p-6 lg:col-span-1">
        <h3 className="text-lg font-semibold text-foreground mb-4">معدل النجاح</h3>
        <div className="flex items-center justify-center mb-4">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-secondary"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${2.827 * successRate} 282.7`}
                className="text-accent transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{successRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">نجاح</p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm text-center text-muted-foreground">معدل نجاح عمليات الدخول في آخر 30 يوم</p>
      </Card>

      {/* Login Trend */}
      <Card className="p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold text-foreground mb-4">اتجاه عمليات الدخول</h3>
        <div className="space-y-4">
          {loginTrend.map((day, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-20 text-sm text-muted-foreground text-left">{formatDate(day.date)}</div>
              <div className="flex-1">
                <div className="flex gap-1 mb-2">
                  <div
                    className="h-8 bg-green-500 rounded-sm"
                    style={{
                      width: `${(day.successful / maxCount) * 100}%`,
                      minWidth: day.successful > 0 ? '4px' : '0',
                    }}
                    title={`ناجح: ${day.successful}`}
                  />
                  <div
                    className="h-8 bg-red-500 rounded-sm"
                    style={{
                      width: `${(day.failed / maxCount) * 100}%`,
                      minWidth: day.failed > 0 ? '4px' : '0',
                    }}
                    title={`فاشل: ${day.failed}`}
                  />
                </div>
              </div>
              <div className="w-16 text-sm font-semibold text-foreground text-left">{day.count}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })
}
