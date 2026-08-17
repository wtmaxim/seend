import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { DataroomsClient } from "@/components/datarooms/datarooms-client"
import { DataroomsLockedPage } from "@/components/datarooms/datarooms-locked-page"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/topbar"
import { getDocumentAccess } from "@/lib/document-access"
import { getOrganizationLimits } from "@/lib/plan-limits"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = { title: "Datarooms · Seend", description: "Vos collections de documents." }

export default async function DataroomsPage() {
  const access = await getDocumentAccess()
  if (!access?.session?.user) redirect("/login")
  if (!access.membership) redirect("/register")

  const limits = await getOrganizationLimits(access.membership.organizationId)
  if (limits.datarooms <= 0) {
    return (
      <DataroomsLockedPage
        userName={access.session.user.name || access.session.user.email}
        organizationName={access.organization?.name}
        organizations={access.organizations}
        activeOrganizationId={access.membership.organizationId}
        isOwner={access.membership.role === "owner"}
      />
    )
  }

  const datarooms = await prisma.dataroom.findMany({
    where: { organizationId: access.membership.organizationId },
    include: { _count: { select: { documents: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <>
      <Sidebar
        organizationName={access.organization?.name}
        organizations={access.organizations}
        activeOrganizationId={access.membership.organizationId}
      />
      <TopBar userName={access.session.user.name || access.session.user.email} />
      <main className="ml-16 min-h-svh px-8 pb-16 pt-6">
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl text-foreground">Datarooms</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Regroupez vos documents pour {access.organization?.name}.
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>{access.membership.role}</p>
              <p>{datarooms.length} dataroom{datarooms.length === 1 ? "" : "s"}</p>
            </div>
          </header>
          <DataroomsClient
            datarooms={datarooms.map((dataroom) => ({
              id: dataroom.id,
              name: dataroom.name,
              description: dataroom.description,
              documentCount: dataroom._count.documents,
              createdAt: dataroom.createdAt.toISOString(),
            }))}
            canManage={access.canManage}
          />
        </div>
      </main>
    </>
  )
}
