import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/auth-shell"
import { RegisterForm } from "@/components/auth/register-form"
import { auth } from "@/lib/auth"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta.register")
  return { title: t("title"), description: t("description") }
}

export default async function RegisterPage() {
  const t = await getTranslations("auth")
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
      title={t("register.title")}
      description={t("register.description")}
      footerText={t("register.footerText")}
      footerLabel={t("register.footerLabel")}
      footerHref="/login"
    >
      <RegisterForm initialStage={initialStage} />
    </AuthShell>
  )
}
