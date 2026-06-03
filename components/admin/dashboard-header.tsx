'use client'

import { Bell, Settings, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface DashboardHeaderProps {
  title: string
  description?: string
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-card">
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/settings')}>
          <Settings className="w-5 h-5" />
        </Button>

        {/* User Profile */}
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/profile')}>
          <User className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}
