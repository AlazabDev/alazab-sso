'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardHeader } from '@/components/admin/dashboard-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { AuthProvider } from '@/lib/types/admin.types'

export default function ProviderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const providerId = params.id as string

  const [provider, setProvider] = useState<AuthProvider | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    client_id: '',
    client_secret: '',
    is_active: true,
  })

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/admin/providers/${providerId}`)
        if (response.ok) {
          const data = await response.json()
          setProvider(data)
          setFormData({
            name: data.name,
            client_id: data.client_id,
            client_secret: data.client_secret,
            is_active: data.is_active,
          })
        }
      } catch (error) {
        console.error('[v0] Error fetching provider:', error)
      } finally {
        setLoading(false)
      }
    }

    if (providerId !== 'new') {
      fetchProvider()
    }
  }, [providerId])

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/providers/${providerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updated = await response.json()
        setProvider(updated)
        alert('تم حفظ التغييرات بنجاح')
      }
    } catch (error) {
      console.error('[v0] Error saving provider:', error)
      alert('فشل حفظ التغييرات')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('هل تريد حذف هذا الموردين نهائياً؟')) return

    try {
      const response = await fetch(`/api/admin/providers/${providerId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/admin/providers')
      }
    } catch (error) {
      console.error('[v0] Error deleting provider:', error)
      alert('فشل حذف الموردين')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/providers">
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
        <DashboardHeader
          title={provider?.name || 'وسيط جديد'}
          description={provider?.description || 'إدارة تفاصيل الوسيط'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <Card className="lg:col-span-2 p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">اسم الوسيط</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">معرّف العميل</label>
              <input
                type="text"
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">سر العميل</label>
              <input
                type="password"
                value={formData.client_secret}
                onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-foreground">
                تفعيل هذا الوسيط
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
              {provider && (
                <Button variant="destructive" onClick={handleDelete} className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  حذف
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Statistics */}
        {provider && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">الإحصائيات</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">نوع الوسيط:</span>
                <span className="font-medium text-foreground capitalize">{provider.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">عمليات الدخول:</span>
                <span className="font-medium text-foreground">{provider.login_count.toLocaleString('ar-SA')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">معدل النجاح:</span>
                <span className="font-medium text-green-600">{provider.success_rate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الفشل:</span>
                <span className="font-medium text-red-600">{provider.failure_count.toLocaleString('ar-SA')}</span>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  تم الإنشاء: {new Date(provider.created_at).toLocaleString('ar-SA')}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
