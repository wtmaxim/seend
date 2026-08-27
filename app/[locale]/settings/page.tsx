import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { redirect } from "next/navigation"

import { getDocumentAccess } from "@/lib/document-access"
import { formatBytes } from "@/lib/format-bytes"
import { prisma } from "@/lib/prisma"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta.settings")
  return { title: t("title"), description: t("description") }
}

export default async function SettingsPage() {
  const access = await getDocumentAccess()
  if (!access?.session?.user) redirect("/login")
  if (!access.membership || !access.organization) redirect("/register")

  const t = await getTranslations("settings.rows")
  const tCommon = await getTranslations("common")

  const [documentCount, memberCount, sizeAgg] = await Promise.all([
    prisma.document.count({ where: { organizationId: access.membership.organizationId } }),
    prisma.member.count({ where: { organizationId: access.membership.organizationId } }),
    prisma.document.aggregate({
      where: { organizationId: access.membership.organizationId },
      _sum: { size: true },
    }),
  ])

  const rows = [
    { label: t("organizationName"), value: access.organization.name },
    { label: t("slug"), value: access.organization.slug },
    { label: t("yourRole"), value: access.membership.role },
    { label: t("members"), value: String(memberCount) },
    { label: t("documents"), value: String(documentCount) },
    { label: t("storageUsed"), value: formatBytes(sizeAgg._sum.size || 0, tCommon.raw("bytes") as string[]) },
  ]

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 text-sm last:border-b-0"
        >
          <span className="text-muted-foreground">{row.label}</span>
          <span className="font-medium text-foreground">{row.value}</span>
        </div>
      ))}
    </div>
  )
}
