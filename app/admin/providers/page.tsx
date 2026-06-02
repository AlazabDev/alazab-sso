'use client'

import { useEffect, useState } from 'react'
import { DashboardHeader } from '@/components/admin/dashboard-header'
import { ProviderList } from '@/components/admin/providers/provider-list'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'
import type { AuthProvider, PaginatedResponse } from '@/lib/types/admin.types'

export default function ProvidersPage() {
  const [providers, setProviders] = useState<AuthProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [type, setType] = useState<string | undefined>()

  const fetchProviders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (type) params.append('type', type)

      const response = await fetch(`/api/admin/providers?${params.toString()}`)
      if (response.ok) {
        const data: PaginatedResponse<AuthProvider> = await response.json()
        setProviders(data.data)
      }
    } catch (error) {
      console.error('[v0] Error fetching providers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProviders()
    }, 300)

    return () => clearTimeout(timer)
  }, [search, type])

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذا الموردين؟')) return

    try {
      const response = await fetch(`/api/admin/providers/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setProviders(providers.filter(p => p.id !== id))
      }
    } catch (error) {
      console.error('[v0] Error deleting provider:', error)
    }
  }

  const handleStatusToggle = async (id: string, status: boolean) => {
    try {
      const response = await fetch(`/api/admin/providers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !status }),
      })

      if (response.ok) {
        setProviders(
          providers.map(p =>
            p.id === id ? { ...p, is_active: !status } : p
          )
        )
      }
    } catch (error) {
      console.error('[v0] Error updating provider:', error)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <DashboardHeader
          title="إدارة وسائط المصادقة"
          description="أضف وعدّل وسائط المصادقة المختلفة"
        />
        <Button asChild className="gap-2">
          <Link href="/admin/providers/new">
            <Plus className="w-4 h-4" />
            إضافة وسيط
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="البحث عن الموردين..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <select
            value={type || ''}
            onChange={(e) => setType(e.target.value || undefined)}
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">كل الأنواع</option>
            <option value="oauth">OAuth</option>
            <option value="oidc">OIDC</option>
            <option value="sso">SSO</option>
            <option value="email">البريد الإلكتروني</option>
            <option value="sms">SMS</option>
          </select>
        </div>
      </Card>

      {/* Providers List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (
        <ProviderList
          providers={providers}
          onDelete={handleDelete}
          onStatusToggle={handleStatusToggle}
        />
      )}
    </div>
  )
}
