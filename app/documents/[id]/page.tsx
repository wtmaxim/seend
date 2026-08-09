import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { DocumentDetailClient } from "@/components/documents/document-detail-client"
import { Sidebar } from "@/components/layout/sidebar"
import { PageTimeChart } from "@/components/share-links/page-time-chart"
import { ShareLinksClient } from "@/components/share-links/share-links-client"
import { VisitsChart } from "@/components/share-links/visits-chart"
import { VisitsTable } from "@/components/share-links/visits-table"
import { TopBar } from "@/components/layout/topbar"
import { getDocumentAccess } from "@/lib/document-access"
import { prisma } from "@/lib/prisma"
import { getPageStats, getVisitStats } from "@/lib/share-link-analytics"

export const metadata: Metadata = { title: "Document · Seend", description: "Détail du document." }

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await getDocumentAccess()
  if (!access?.session?.user) redirect("/login")
  if (!access.membership) redirect("/register")
  const { id } = await params

  const document = await prisma.document.findFirst({
    where: { id, organizationId: access.membership.organizationId },
    include: {
      uploadedBy: { select: { name: true, email: true } },
      dataroomLinks: { include: { dataroom: { select: { id: true, name: true } } } },
      shareLinks: {
        include: { visits: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })
  if (!document) notFound()

  const allVisits = document.shareLinks.flatMap((link) =>
    link.visits.map((visit) => ({ ...visit, linkLabel: link.label }))
  )

  const visitIds = allVisits.map((visit) => visit.id)
  const [stats, pageStats] = await Promise.all([getVisitStats(visitIds), getPageStats(document.id)])

  const visits = allVisits
    .map((visit) => {
      // A visit with no pings yet has just started: it has been active for
      // no measured time, and was last seen when it opened.
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
            <Link href="/documents" className="text-xs text-muted-foreground hover:text-foreground">
              ← Documents
            </Link>
            <h1 className="mt-4 truncate font-serif text-3xl text-foreground">{document.originalName}</h1>
          </header>
          <DocumentDetailClient
            document={{
              id: document.id,
              originalName: document.originalName,
              contentType: document.contentType,
              size: document.size,
              createdAt: document.createdAt.toISOString(),
              uploadedBy: document.uploadedBy?.name || document.uploadedBy?.email || "Unknown",
            }}
            canManage={access.canManage}
            datarooms={document.dataroomLinks.map((link) => ({ id: link.dataroom.id, name: link.dataroom.name }))}
          />
          {access.canManage && (
            <>
              <ShareLinksClient
                createUrl={`/api/documents/${document.id}/share`}
                links={document.shareLinks
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
              <PageTimeChart secondsByPage={pageStats} />
              <VisitsTable visits={visits} />
            </>
          )}
        </div>
      </main>
    </>
  )
}
