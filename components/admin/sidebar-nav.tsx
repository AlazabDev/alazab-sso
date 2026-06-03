'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Settings,
  Users,
  PlugIcon,
  BarChart3,
  LogOut,
} from 'lucide-react'

const routes = [
  {
    label: 'لوحة التحكم',
    icon: LayoutDashboard,
    href: '/admin',
    color: 'text-sky-500',
  },
  {
    label: 'وسائط المصادقة',
    icon: PlugIcon,
    href: '/admin/providers',
    color: 'text-violet-500',
  },
  {
    label: 'المستخدمون',
    icon: Users,
    href: '/admin/users',
    color: 'text-pink-500',
  },
  {
    label: 'التحليلات والتقارير',
    icon: BarChart3,
    href: '/admin/analytics',
    color: 'text-orange-500',
  },
  {
    label: 'الإعدادات',
    icon: Settings,
    href: '/admin/settings',
    color: 'text-emerald-500',
  },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-card border-l border-border">
      {/* Logo Section */}
      <div className="px-3 py-2 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-white text-sm font-bold">AZ</span>
        </div>
        <h2 className="font-bold text-lg text-foreground">العزب</h2>
      </div>

      {/* Navigation Links */}
      <nav className="space-y-2 flex-1">
        {routes.map((route) => {
          const isActive = pathname === route.href || pathname.startsWith(`${route.href}/`)
          const Icon = route.icon

          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                'text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-secondary/50 rounded-lg transition',
                isActive ? 'bg-secondary text-accent' : 'text-muted-foreground'
              )}
            >
              <div className="flex items-center flex-1 gap-3">
                <Icon className={cn('w-5 h-5', isActive ? 'text-accent' : route.color)} />
                {route.label}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="border-t border-border pt-4 px-3">
        <Link
          href="/api/auth/logout"
          className="text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-destructive/10 rounded-lg transition text-muted-foreground hover:text-destructive"
        >
          <LogOut className="w-5 h-5" />
          <span className="mr-3">تسجيل الخروج</span>
        </Link>
      </div>
    </div>
  )
}
