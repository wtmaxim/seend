import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Sign in · Seend",
  description: "Sign in to your Seend account.",
}

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (session?.user) {
    redirect("/")
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in with your work email to continue."
      footerText="New to Seend?"
      footerLabel="Create an account"
      footerHref="/register"
    >
      <LoginForm />
    </AuthShell>
  )
}
