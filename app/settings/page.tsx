'use client'

import { useAuth } from '@/lib/auth/context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
      setLinkedAccounts(response.data)
    } catch (error) {
      console.error('Error fetching linked accounts:', error)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!profile) return

    try {
      setIsSaving(true)
      setSaveMessage(null)
      await axios.patch('/api/user/profile', {
        full_name: profile.full_name,
        language_preference: profile.language_preference,
      })
      setSaveMessage({ type: 'success', text: 'Profile updated successfully' })
    } catch (error) {
      setSaveMessage({
        type: 'error',
        text: axios.isAxiosError(error) ? error.response?.data?.error : 'Failed to update profile',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUnlinkAccount = async (provider: string) => {
    try {
      await axios.delete(`/api/user/accounts?provider=${provider}`)
      fetchLinkedAccounts()
      setSaveMessage({ type: 'success', text: `${provider} account unlinked` })
    } catch (error) {
      setSaveMessage({
        type: 'error',
        text: 'Failed to unlink account',
      })
    }
  }

  if (isLoading || isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Settings</h1>
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {saveMessage && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              saveMessage.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <p
              className={`text-sm ${
                saveMessage.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {saveMessage.text}
            </p>
          </div>
        )}

        <div className="grid gap-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profile.full_name || ''}
                    onChange={(e) =>
                      setProfile({ ...profile, full_name: e.target.value })
                    }
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language Preference</Label>
                  <select
                    id="language"
                    value={profile.language_preference}
                    onChange={(e) =>
                      setProfile({ ...profile, language_preference: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-input rounded-md"
                  >
                    <option value="en">English</option>
                    <option value="ar">العربية (Arabic)</option>
                  </select>
                </div>

                <Button type="submit" disabled={isSaving} className="w-full">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Linked Accounts */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>
                Manage your linked OAuth accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {linkedAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No linked accounts yet
                </p>
              ) : (
                <div className="space-y-4">
                  {linkedAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div>
                        <p className="font-medium capitalize">{account.provider}</p>
                        <p className="text-sm text-muted-foreground">
                          {account.provider_email}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleUnlinkAccount(account.provider)}
                        variant="destructive"
                        size="sm"
                      >
                        Unlink
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">User ID</p>
                <p className="font-mono text-sm text-xs">{user.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account Created</p>
                <p className="text-sm">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
