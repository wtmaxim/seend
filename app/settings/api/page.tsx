import type { Metadata } from "next"
import { KeyRound } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { ApiKeysSettings } from "@/components/settings/api-keys-settings"
import { Button } from "@/components/ui/button"
import { getDocumentAccess } from "@/lib/document-access"
import { getOrganizationLimits } from "@/lib/plan-limits"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = { title: "API · Seend", description: "Clés API de votre organisation." }

export default async function SettingsApiPage() {
  const access = await getDocumentAccess()
  if (!access?.session?.user) redirect("/login")
  if (!access.membership) redirect("/register")

  const limits = await getOrganizationLimits(access.membership.organizationId)

  // Inline rather than a blocking modal: this is a settings tab, and the tab
  // that fixes it is one click away in the same nav.
  if (!limits.api) {
    return (
      <div className="rounded-2xl border border-border p-10 text-center">
        <KeyRound className="mx-auto mb-3 size-7 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">L&apos;API fait partie du plan Business</p>
        <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
          Pilote Seend depuis tes propres outils : uploader des documents, créer des datarooms et générer des liens
          de partage par programmation.
        </p>
        {access.membership.role === "owner" ? (
          <Button asChild className="mt-5">
            <Link href="/settings/billing">Passer à Business</Link>
          </Button>
        ) : (
          <p className="mt-5 text-xs text-muted-foreground">
            Demande au propriétaire de l&apos;organisation de passer au plan Business.
          </p>
        )}
      </div>
    )
  }

  const apiKeys = await prisma.apiKey.findMany({
    where: { organizationId: access.membership.organizationId, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, hint: true, createdAt: true, lastUsedAt: true },
  })

  return (
    <ApiKeysSettings
      canManage={access.canManage}
      apiKeys={apiKeys.map((apiKey) => ({
        id: apiKey.id,
        name: apiKey.name,
        hint: apiKey.hint,
        createdAt: apiKey.createdAt.toISOString(),
        lastUsedAt: apiKey.lastUsedAt?.toISOString() ?? null,
      }))}
    />
  )
}
