'use client'

import { LoginHeroSection } from '@/components/auth/login-hero-section'
import { AlazabLoginCard } from '@/components/auth/alazab-login-card'

export default function LoginPage() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-background overflow-hidden">
      <div className="w-full max-w-6xl flex items-center rounded-2xl overflow-hidden">
        {/* Hero Section (Left) */}
        <LoginHeroSection />

        {/* Login Card (Right) */}
        <div className="w-full lg:w-1/2 px-4 py-8 lg:px-0">
          <AlazabLoginCard />
        </div>
      </div>
    </div>
  )
}
