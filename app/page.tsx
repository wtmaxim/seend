import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { TopBar } from "@/components/layout/topbar"
import { Sidebar } from "@/components/layout/sidebar"
import { DashboardClient } from "@/components/layout/dashboard-client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect("/login")
  }

  const memberships = await prisma.member.findMany({
    where: { userId: session.user.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  })

  const active = session.session.activeOrganizationId
  const membership =
    memberships.find((item) => item.organizationId === active) ?? memberships[0]

  if (!membership) {
    redirect("/register")
  }

  const [allDocuments, teamMembers] = await Promise.all([
    prisma.document.findMany({
      where: { organizationId: membership.organizationId },
      select: { id: true, originalName: true, size: true, createdAt: true },
    }),
    prisma.member.count({
      where: { organizationId: membership.organizationId },
    }),
  ])

  const totalSize = allDocuments.reduce((sum, doc) => sum + doc.size, 0)

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOfToday)
    date.setDate(date.getDate() - (6 - index))
    return { date, count: 0 }
  })
  for (const doc of allDocuments) {
    const docDate = new Date(doc.createdAt)
    docDate.setHours(0, 0, 0, 0)
    const day = days.find((d) => d.date.getTime() === docDate.getTime())
    if (day) day.count += 1
  }
  const activityCounts = days.map((d) => d.count)

  const sevenDaysAgo = new Date(startOfToday)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const recentBatch = allDocuments.filter((doc) => doc.createdAt >= sevenDaysAgo)
  const documentsThisWeek = recentBatch.length
  const sizeThisWeek = recentBatch.reduce((sum, doc) => sum + doc.size, 0)

  const biggestDocument = allDocuments.reduce<typeof allDocuments[number] | null>(
    (max, doc) => (!max || doc.size > max.size ? doc : max),
    null
  )

  return (
    <>
      <Sidebar
        organizationName={membership.organization.name}
        organizations={memberships.map((item) => ({ id: item.organization.id, name: item.organization.name }))}
        activeOrganizationId={membership.organizationId}
      />
      <TopBar userName={session.user.name || session.user.email} />
      <DashboardClient
        userName={session.user.name || session.user.email}
        organizationName={membership.organization.name}
        documentCount={allDocuments.length}
        documentsThisWeek={documentsThisWeek}
        sizeThisWeek={sizeThisWeek}
        totalSize={totalSize}
        teamMembers={teamMembers}
        biggestDocument={biggestDocument ? { originalName: biggestDocument.originalName, size: biggestDocument.size } : null}
        activityCounts={activityCounts}
      />
    </>
  )
}
