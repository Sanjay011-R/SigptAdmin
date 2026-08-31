import { LoginForm } from "@/components/login-form"
import { AuthLayout } from "@/layouts/auth-layout"

export function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  )
}
