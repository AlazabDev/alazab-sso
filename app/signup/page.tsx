import { SignUpForm } from '@/components/auth/signup-form'
import { GradientCanvas } from '@/components/gradient-canvas'

export const metadata = {
  title: 'Sign Up - SSO System',
  description: 'Create a new account on our platform',
}

export default function SignUpPage() {
  return (
    <div className="relative w-full min-h-screen flex items-center justify-center bg-background overflow-hidden">
      {/* Gradient background */}
      <GradientCanvas />

      {/* Content */}
      <div className="relative z-10 w-full px-4 py-8">
        <SignUpForm />
      </div>
    </div>
  )
}
