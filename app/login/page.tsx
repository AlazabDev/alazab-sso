import { MultiProviderLogin } from '@/components/auth/multi-provider-login'
import { GradientCanvas } from '@/components/gradient-canvas'

export const metadata = {
  title: 'Sign In - SSO System',
  description: 'Sign in to your account with multiple authentication options',
}

export default function LoginPage() {
  return (
    <div className="relative w-full min-h-screen flex items-center justify-center bg-background overflow-hidden">
      {/* Gradient background */}
      <GradientCanvas />

      {/* Content */}
      <div className="relative z-10 w-full px-4 py-8">
        <MultiProviderLogin />
      </div>
    </div>
  )
}
