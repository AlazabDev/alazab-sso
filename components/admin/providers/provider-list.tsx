'use client'

import { AuthProvider } from '@/lib/types/admin.types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, Edit2, Eye } from 'lucide-react'
import Link from 'next/link'

interface ProviderListProps {
  providers: AuthProvider[]
  onDelete: (id: string) => Promise<void>
  onStatusToggle: (id: string, status: boolean) => Promise<void>
}

export function ProviderList({ providers, onDelete, onStatusToggle }: ProviderListProps) {
  if (providers.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">لا توجد وسائط مصادقة</p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {providers.map((provider) => (
        <Card key={provider.id} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {provider.logo_url && (
                <img
                  src={provider.logo_url}
                  alt={provider.name}
                  className="w-10 h-10 rounded-lg"
                />
              )}
              <div>
                <h3 className="font-semibold text-foreground">{provider.name}</h3>
                <p className="text-xs text-muted-foreground">{provider.type}</p>
              </div>
            </div>
            <Badge variant={provider.is_active ? 'default' : 'secondary'}>
              {provider.is_active ? 'مفعل' : 'معطل'}
            </Badge>
          </div>

          {provider.description && (
            <p className="text-sm text-muted-foreground mb-4">{provider.description}</p>
          )}

          <div className="space-y-2 mb-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">عمليات الدخول:</span>
              <span className="font-medium">{provider.login_count.toLocaleString('ar-SA')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">معدل النجاح:</span>
              <span className="font-medium text-green-600">{provider.success_rate.toFixed(1)}%</span>
            </div>
            {provider.failure_count > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">الفشل:</span>
                <span className="font-medium text-red-600">{provider.failure_count.toLocaleString('ar-SA')}</span>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              asChild
            >
              <Link href={`/admin/providers/${provider.id}`}>
                <Eye className="w-4 h-4 mr-2" />
                عرض
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(provider.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
