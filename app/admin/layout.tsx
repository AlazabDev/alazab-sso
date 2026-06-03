import type React from 'react'
import type { Metadata } from 'next'
import { SidebarNav } from '@/components/admin/sidebar-nav'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'لوحة التحكم الإدارية - منظومة العزب',
  description: 'إدارة منظومة المصادقة والمستخدمين',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // In a real app, you would check authentication here
  // For now, we'll allow access for development

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 overflow-y-auto border-r border-border">
        <SidebarNav />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="bg-background">{children}</div>
      </main>
    </div>
  )
}
