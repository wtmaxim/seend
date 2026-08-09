import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/auth-shell"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Reset password · Seend",
  description: "Request a password reset link for your Seend account.",
}

export default async function ForgotPasswordPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (session?.user) {
    redirect("/")
  }

  return (
    <AuthShell
      title="Forgot your password?"
      description="Enter your email and we'll send you a reset link."
      footerText="Remembered it?"
      footerLabel="Back to sign in"
      footerHref="/login"
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
