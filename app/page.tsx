import { GradientCanvas } from "@/components/gradient-canvas"
import { LoginForm } from "@/components/login-form"

export default function Home() {
  return (
    <main className="w-screen h-screen flex">
      <div className="w-1/2 h-full">
        <LoginForm /> 
      </div>
      <div className="w-1/2 h-full">
        <GradientCanvas />
      </div>
    </main>
  )
}
