import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/auth-shell"
import { RegisterForm } from "@/components/auth/register-form"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Create account · Seend",
  description: "Create your Seend account and organization.",
}

export default async function RegisterPage() {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })

  let initialStage: "account" | "organization" = "account"

  if (session?.user) {
    const organizations = await auth.api.listOrganizations({
      headers: requestHeaders,
    })

    if (organizations.length > 0) {
      redirect("/")
    }

    initialStage = "organization"
  }

  return (
    <AuthShell
      title="Create your account"
      description="Set up your account and organization in one step."
      footerText="Already have an account?"
      footerLabel="Sign in"
      footerHref="/login"
    >
      <RegisterForm initialStage={initialStage} />
    </AuthShell>
  )
}
