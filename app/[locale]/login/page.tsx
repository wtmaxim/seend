import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"
import { auth } from "@/lib/auth"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta.login")
  return { title: t("title"), description: t("description") }
}

export default async function LoginPage() {
  const t = await getTranslations("auth")
  const session = await auth.api.getSession({ headers: await headers() })

  if (session?.user) {
    redirect("/")
  }

  return (
    <AuthShell
      title={t("login.title")}
      description={t("login.description")}
      footerText={t("login.footerText")}
      footerLabel={t("login.footerLabel")}
      footerHref="/register"
    >
      <LoginForm />
    </AuthShell>
  )
}
