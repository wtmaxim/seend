import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/auth-shell"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { auth } from "@/lib/auth"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta.resetPassword")
  return { title: t("title"), description: t("description") }
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth")
  const session = await auth.api.getSession({ headers: await headers() })

  if (session?.user) {
    redirect("/")
  }

  return (
    <AuthShell
      title={t("forgot.title")}
      description={t("forgot.description")}
      footerText={t("forgot.footerText")}
      footerLabel={t("forgot.footerLabel")}
      footerHref="/login"
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
