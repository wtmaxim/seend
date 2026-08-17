import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AccountSettings } from "@/components/settings/account-settings"
import { getDocumentAccess } from "@/lib/document-access"

export const metadata: Metadata = { title: "Compte · Seend", description: "Paramètres de votre compte." }

export default async function SettingsAccountPage() {
  const access = await getDocumentAccess()
  if (!access?.session?.user) redirect("/login")

  return <AccountSettings userEmail={access.session.user.email} />
}
