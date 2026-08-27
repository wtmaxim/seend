import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { AuthShell } from "@/components/auth/auth-shell"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta.newPassword")
  return { title: t("title"), description: t("description") }
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const t = await getTranslations("auth")
  const { token } = await searchParams

  return (
    <AuthShell
      title={t("reset.title")}
      description={t("reset.description")}
      footerText={t("reset.footerText")}
      footerLabel={t("reset.footerLabel")}
      footerHref="/login"
    >
      <ResetPasswordForm token={token ?? null} />
    </AuthShell>
  )
}
