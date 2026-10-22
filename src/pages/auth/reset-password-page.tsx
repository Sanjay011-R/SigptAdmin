import { ResetPasswordForm } from "@/components/reset-password-form"
import { AuthLayout } from "@/layouts/auth-layout"

export function ResetPasswordPage() {
  return (
    <AuthLayout>
      <ResetPasswordForm />
    </AuthLayout>
  )
}
