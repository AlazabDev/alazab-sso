'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import axios from 'axios'

interface SignUpFormData {
  email: string
  password: string
  confirmPassword: string
  fullName: string
  userType: 'customer' | 'partner' | 'employee'
}

export function SignUpForm() {
  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    userType: 'customer',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, userType: value as SignUpFormData['userType'] }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.email || !formData.password || !formData.fullName) {
      setError('All fields are required')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      setIsLoading(true)

      const response = await axios.post('/api/auth/signup', {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        userType: formData.userType,
      })

      if (response.data.user) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login?signup=success')
        }, 2000)
      }
    } catch (err) {
      const errorMessage =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : 'Failed to sign up'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-sm mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Account Created!</h1>
          <p className="text-sm text-muted-foreground">
            Check your email to confirm your account. You&apos;ll be redirected to login shortly.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Join our platform and get started
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="John Doe"
            value={formData.fullName}
            onChange={handleInputChange}
            disabled={isLoading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleInputChange}
            disabled={isLoading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="userType">Account Type</Label>
          <Select value={formData.userType} onValueChange={handleSelectChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="partner">Partner</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
            </SelectContent>
          </Select>
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
            disabled={isLoading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            disabled={isLoading}
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full h-11"
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <button
          onClick={() => router.push('/login')}
          className="underline hover:text-foreground transition-colors"
        >
          Sign in
        </button>
      </p>
    </div>
  )
}
