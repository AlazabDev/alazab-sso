'use client'

import { useAuth } from '@/lib/auth/context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SessionManager } from '@/components/settings/session-manager'
import { NotificationPreferencesComponent } from '@/components/settings/notification-preferences'
import axios from 'axios'

interface UserProfile {
  full_name: string
  email: string
  avatar_url?: string
  language_preference: string
}

interface LinkedAccount {
  id: string
  provider: string
  provider_email: string
  created_at: string
}

export default function SettingsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([])
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [isLoading, user, router])

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchLinkedAccounts()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      setIsLoadingProfile(true)
      const response = await axios.get('/api/user/profile')
      setProfile(response.data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const fetchLinkedAccounts = async () => {
    try {
      const response = await axios.get('/api/user/accounts')
      setLinkedAccounts(response.data.accounts || [])
    } catch (error) {
      console.error('Error fetching linked accounts:', error)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!profile) return

    try {
      setIsSaving(true)
      await axios.patch('/api/user/profile', profile)
      setSaveMessage({ type: 'success', text: 'تم حفظ التغييرات بنجاح' })
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
      setSaveMessage({ type: 'error', text: 'حدث خطأ في حفظ التغييرات' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUnlinkAccount = async (accountId: string) => {
    if (!confirm('هل تريد فصل هذا الحساب؟')) return

    try {
      await axios.post(`/api/user/accounts/unlink`, { accountId })
      setLinkedAccounts(linkedAccounts.filter(acc => acc.id !== accountId))
      setSaveMessage({ type: 'success', text: 'تم فصل الحساب بنجاح' })
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error('Error unlinking account:', error)
      setSaveMessage({ type: 'error', text: 'حدث خطأ في فصل الحساب' })
    }
  }

  if (isLoading || isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-foreground/60">جاري التحميل...</p>
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
          <h1 className="text-2xl font-bold">الإعدادات</h1>
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
          >
            العودة إلى لوحة التحكم
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {saveMessage && (
          <Card className={`mb-6 ${saveMessage.type === 'success' ? 'border-green-200' : 'border-red-200'}`}>
            <CardContent className={`pt-6 ${saveMessage.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
              {saveMessage.text}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>
            <TabsTrigger value="accounts">الحسابات المرتبطة</TabsTrigger>
            <TabsTrigger value="sessions">الجلسات</TabsTrigger>
            <TabsTrigger value="notifications">الإخطارات</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>معلومات الملف الشخصي</CardTitle>
                <CardDescription>قم بتحديث معلومات ملفك الشخصي</CardDescription>
              </CardHeader>
              <CardContent>
                {profile ? (
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div>
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        disabled
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="full_name">الاسم الكامل</Label>
                      <Input
                        id="full_name"
                        type="text"
                        value={profile.full_name}
                        onChange={(e) =>
                          setProfile({ ...profile, full_name: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="language">لغة التفضيل</Label>
                      <select
                        id="language"
                        value={profile.language_preference}
                        onChange={(e) =>
                          setProfile({ ...profile, language_preference: e.target.value })
                        }
                        className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background"
                      >
                        <option value="ar">العربية</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                    </Button>
                  </form>
                ) : (
                  <p className="text-foreground/60">لم يتم تحميل البيانات</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Linked Accounts Tab */}
          <TabsContent value="accounts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>الحسابات المرتبطة</CardTitle>
                <CardDescription>إدارة الحسابات المرتبطة بملفك الشخصي</CardDescription>
              </CardHeader>
              <CardContent>
                {linkedAccounts.length === 0 ? (
                  <p className="text-foreground/60">لا توجد حسابات مرتبطة</p>
                ) : (
                  <div className="space-y-4">
                    {linkedAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium capitalize text-foreground">
                            {account.provider}
                          </p>
                          <p className="text-sm text-foreground/60">
                            {account.provider_email}
                          </p>
                          <p className="text-xs text-foreground/40 mt-1">
                            متصل منذ {new Date(account.created_at).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleUnlinkAccount(account.id)}
                        >
                          فصل الحساب
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <SessionManager />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <NotificationPreferencesComponent />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
