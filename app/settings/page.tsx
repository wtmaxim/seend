import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getDocumentAccess } from "@/lib/document-access"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = { title: "Paramètres · Seend", description: "Aperçu de votre organisation." }

function formatBytes(bytes: number) {
  if (bytes <= 0) return "0 Ko"
  const units = ["o", "Ko", "Mo", "Go"]
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${(bytes / Math.pow(1024, exponent)).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

export default async function SettingsPage() {
  const access = await getDocumentAccess()
  if (!access?.session?.user) redirect("/login")
  if (!access.membership || !access.organization) redirect("/register")

  const [documentCount, memberCount, sizeAgg] = await Promise.all([
    prisma.document.count({ where: { organizationId: access.membership.organizationId } }),
    prisma.member.count({ where: { organizationId: access.membership.organizationId } }),
    prisma.document.aggregate({
      where: { organizationId: access.membership.organizationId },
      _sum: { size: true },
    }),
  ])

  const rows = [
    { label: "Nom de l'organisation", value: access.organization.name },
    { label: "Identifiant", value: access.organization.slug },
    { label: "Votre rôle", value: access.membership.role },
    { label: "Membres", value: String(memberCount) },
    { label: "Documents", value: String(documentCount) },
    { label: "Stockage utilisé", value: formatBytes(sizeAgg._sum.size || 0) },
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
