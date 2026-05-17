'use client'

import { useAuth } from '@/lib/auth/context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import axios from 'axios'

export default function DashboardPage() {
  const { user, isLoading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [isLoading, user, router])

  const handleSignOut = async () => {
    try {
      await axios.post('/api/auth/signout')
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
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
          <h1 className="text-xl font-bold">Dashboard</h1>
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome!</CardTitle>
              <CardDescription>
                You are successfully logged in to the SSO system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-mono text-sm">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">User ID</p>
                <p className="font-mono text-sm text-xs">{user.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Sign In</p>
                <p className="text-sm">
                  {user.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleString()
                    : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Manage your account settings and linked providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={() => router.push('/settings')}
                  className="w-full"
                >
                  Go to Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
