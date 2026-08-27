import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { redirect } from "next/navigation"

import { AccountSettings } from "@/components/settings/account-settings"
import { getDocumentAccess } from "@/lib/document-access"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta.account")
  return { title: t("title"), description: t("description") }
}

export default async function SettingsAccountPage() {
  const access = await getDocumentAccess()
  if (!access?.session?.user) redirect("/login")

  return <AccountSettings userEmail={access.session.user.email} />
}
