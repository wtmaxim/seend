import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { DataroomDetailClient } from "@/components/datarooms/dataroom-detail-client"
import { DataroomsLockedPage } from "@/components/datarooms/datarooms-locked-page"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/topbar"
import { ShareLinksClient } from "@/components/share-links/share-links-client"
import { VisitsChart } from "@/components/share-links/visits-chart"
import { VisitsTable } from "@/components/share-links/visits-table"
import { getDocumentAccess } from "@/lib/document-access"
import { getOrganizationLimits } from "@/lib/plan-limits"
import { prisma } from "@/lib/prisma"
import { getVisitStats } from "@/lib/share-link-analytics"

export const metadata: Metadata = { title: "Dataroom · Seend", description: "Détail de la dataroom." }

export default async function DataroomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await getDocumentAccess()
  if (!access?.session?.user) redirect("/login")
  if (!access.membership) redirect("/register")
  const { id } = await params

  // A downgraded org can still hold datarooms created while on a paid plan;
  // they stay in the database but must not be reachable.
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

  const dataroom = await prisma.dataroom.findFirst({
    where: { id, organizationId: access.membership.organizationId },
    include: {
      documents: {
        include: { document: { include: { uploadedBy: { select: { name: true, email: true } } } } },
        orderBy: { addedAt: "desc" },
      },
      shareLinks: {
        include: { visits: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })
  if (!dataroom) notFound()

  const includedIds = dataroom.documents.map((link) => link.documentId)
  const availableDocuments = await prisma.document.findMany({
    where: { organizationId: access.membership.organizationId, id: { notIn: includedIds } },
    orderBy: { createdAt: "desc" },
  })

  const allVisits = dataroom.shareLinks.flatMap((link) => link.visits.map((visit) => ({ ...visit, linkLabel: link.label })))
  const stats = await getVisitStats(allVisits.map((visit) => visit.id))

  const visits = allVisits
    .map((visit) => {
      const visitStats = stats.get(visit.id)
      return {
        id: visit.id,
        visitorName: visit.visitorName,
        visitorEmail: visit.visitorEmail,
        startedAt: visit.startedAt.toISOString(),
        lastSeenAt: (visitStats?.lastSeenAt ?? visit.startedAt).toISOString(),
        activeSeconds: visitStats?.activeSeconds ?? 0,
        linkLabel: visit.linkLabel,
      }
    })
    .sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime())

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days30 = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today)
    date.setDate(date.getDate() - (29 - index))
    return { date, count: 0 }
  })
  for (const visit of allVisits) {
    const visitDate = new Date(visit.startedAt)
    visitDate.setHours(0, 0, 0, 0)
    const day = days30.find((d) => d.date.getTime() === visitDate.getTime())
    if (day) day.count += 1
  }
  const dailyVisitCounts = days30.map((d) => d.count)

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
          <header>
            <Link href="/datarooms" className="text-xs text-muted-foreground hover:text-foreground">
              ← Datarooms
            </Link>
            <h1 className="mt-4 font-serif text-3xl text-foreground">{dataroom.name}</h1>
            {dataroom.description && <p className="mt-1 text-sm text-muted-foreground">{dataroom.description}</p>}
          </header>
          <DataroomDetailClient
            dataroomId={dataroom.id}
            canManage={access.canManage}
            documents={dataroom.documents.map((link) => ({
              id: link.document.id,
              originalName: link.document.originalName,
              contentType: link.document.contentType,
              size: link.document.size,
              createdAt: link.document.createdAt.toISOString(),
              uploadedBy: link.document.uploadedBy?.name || link.document.uploadedBy?.email || "Unknown",
            }))}
            availableDocuments={availableDocuments.map((document) => ({
              id: document.id,
              originalName: document.originalName,
              contentType: document.contentType,
              size: document.size,
              createdAt: document.createdAt.toISOString(),
              uploadedBy: "",
            }))}
          />
          {access.canManage && (
            <>
              <ShareLinksClient
                createUrl={`/api/datarooms/${dataroom.id}/share`}
                links={dataroom.shareLinks
                  .filter((link) => !link.revoked)
                  .map((link) => ({
                    id: link.id,
                    token: link.token,
                    label: link.label,
                    createdAt: link.createdAt.toISOString(),
                    expiresAt: link.expiresAt?.toISOString() || null,
                    visitCount: link.visits.length,
                    requireName: link.requireName,
                    requireEmail: link.requireEmail,
                    allowedEmails: link.allowedEmails,
                    watermark: link.watermark,
                  }))}
              />
              <VisitsChart dailyCounts={dailyVisitCounts} />
              <VisitsTable visits={visits} />
            </>
          )}
        </div>
      </main>
    </>
  )
}
