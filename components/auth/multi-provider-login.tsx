'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signInWithOAuth, signInWithEmail, signInWithEntra } from '@/lib/auth/providers'
import { useRouter } from 'next/navigation'
import axios from 'axios'

type Provider = 'google' | 'apple' | 'facebook' | 'github' | 'entra'

interface LoginFormData {
  email: string
  password: string
}

export function MultiProviderLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleOAuthSignIn = async (provider: Provider) => {
    try {
      setIsLoading(true)
      setError(null)
      
      if (provider === 'entra') {
        await signInWithEntra()
      } else {
        await signInWithOAuth({ provider })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in'
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      setError(null)

      const response = await axios.post('/api/auth/signin', {
        email: formData.email,
        password: formData.password,
      })

      if (response.data.user) {
        router.push('/dashboard')
      }
    } catch (err) {
      const errorMessage =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : 'Failed to sign in'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const providers: { id: Provider; label: string; icon: string }[] = [
    {
      id: 'entra',
      label: 'Microsoft Entra',
      icon: '🪟',
    },
    {
      id: 'google',
      label: 'Google',
      icon: '🔍',
    },
    {
      id: 'apple',
      label: 'Apple',
      icon: '🍎',
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: '👤',
    },
    {
      id: 'github',
      label: 'GitHub',
      icon: '⚙️',
    },
  ]

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Sign in to your account using one of the options below
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!showEmailForm ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            {providers.map(provider => (
              <Button
                key={provider.id}
                onClick={() => handleOAuthSignIn(provider.id)}
                disabled={isLoading}
                variant="outline"
                className="h-12 w-full flex items-center justify-center gap-2"
              >
                <span>{provider.icon}</span>
                <span className="text-xs">{provider.label}</span>
              </Button>
            ))}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            onClick={() => setShowEmailForm(true)}
            variant="outline"
            className="w-full h-11"
          >
            Sign in with Email
          </Button>
        </>
      ) : (
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>

          <Button
            type="button"
            onClick={() => {
              setShowEmailForm(false)
              setFormData({ email: '', password: '' })
              setError(null)
            }}
            variant="outline"
            className="w-full h-11"
            disabled={isLoading}
          >
            Back to OAuth options
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <button
          onClick={() => router.push('/signup')}
          className="underline hover:text-foreground transition-colors"
        >
          Sign up
        </button>
      </p>
    </div>
  )
}
