import { prisma } from "@/lib/prisma"
import { getDocumentVisitStats, getVisitStats, type VisitStats } from "@/lib/share-link-analytics"

/**
 * Everything the dashboard shows, read in one place: share-link activity
 * rolled up four ways (per link, per document, per visitor, and as a recent
 * feed) plus the daily view counts behind the chart.
 *
 * Viewing time always comes from the ping aggregation in
 * `share-link-analytics`, never from counters — see that module for why.
 */

export type LinkRow = {
  id: string
  label: string
  targetName: string
  targetHref: string
  views: number
  avgSeconds: number
  lastViewedAt: string | null
}

export type DocumentRow = {
  id: string
  name: string
  views: number
  avgSeconds: number
  lastViewedAt: string | null
}

export type VisitorRow = {
  key: string
  name: string | null
  email: string | null
  views: number
  avgSeconds: number
  lastViewedAt: string | null
}

export type RecentViewRow = {
  id: string
  visitorLabel: string
  targetName: string
  startedAt: string
  seconds: number
}

export type DashboardData = {
  dailyCounts: number[]
  links: LinkRow[]
  documents: DocumentRow[]
  visitors: VisitorRow[]
  recentViews: RecentViewRow[]
}

const CHART_DAYS = 30
const RECENT_VIEWS_LIMIT = 20

type Visit = { id: string; visitorName: string | null; visitorEmail: string | null; startedAt: Date }

/** Views, average reading time and last-seen across a set of visits. */
function aggregate(visits: Visit[], stats: Map<string, VisitStats>) {
  const views = visits.length
  const totalSeconds = visits.reduce((sum, visit) => sum + (stats.get(visit.id)?.activeSeconds ?? 0), 0)
  const avgSeconds = views ? Math.round(totalSeconds / views) : 0
  const lastViewedAt = visits.reduce<Date | null>((latest, visit) => {
    // A visit with no ping yet still happened — fall back to when it started.
    const seenAt = stats.get(visit.id)?.lastSeenAt ?? visit.startedAt
    return !latest || seenAt > latest ? seenAt : latest
  }, null)
  return { views, avgSeconds, lastViewedAt: lastViewedAt?.toISOString() ?? null }
}

export async function getDashboardData(organizationId: string): Promise<DashboardData> {
  const [shareLinks, documents] = await Promise.all([
    prisma.shareLink.findMany({
      where: { organizationId, revoked: false },
      select: {
        id: true,
        label: true,
        document: { select: { id: true, originalName: true } },
        dataroom: { select: { id: true, name: true } },
        visits: {
          select: { id: true, visitorName: true, visitorEmail: true, startedAt: true },
          orderBy: { startedAt: "desc" },
        },
      },
    }),
    prisma.document.findMany({
      where: { organizationId },
      select: { id: true, originalName: true },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const allVisits = shareLinks.flatMap((link) => link.visits)
  const [stats, documentStats] = await Promise.all([
    getVisitStats(allVisits.map((visit) => visit.id)),
    getDocumentVisitStats(documents.map((document) => document.id)),
  ])

  const links: LinkRow[] = shareLinks
    .map((link) => {
      const target = link.document
        ? { name: link.document.originalName, href: `/documents/${link.document.id}` }
        : link.dataroom
          ? { name: link.dataroom.name, href: `/datarooms/${link.dataroom.id}` }
          : { name: "Cible supprimée", href: "/documents" }
      return {
        id: link.id,
        label: link.label || target.name,
        targetName: target.name,
        targetHref: target.href,
        ...aggregate(link.visits, stats),
      }
    })
    .sort((a, b) => b.views - a.views)

  const documentRows: DocumentRow[] = documents
    .map((document) => {
      const perVisit = [...(documentStats.get(document.id)?.values() ?? [])]
      const views = perVisit.length
      const avgSeconds = views
        ? Math.round(perVisit.reduce((sum, entry) => sum + entry.activeSeconds, 0) / views)
        : 0
      const lastViewedAt = perVisit.reduce<Date | null>(
        (latest, entry) => (!latest || entry.lastSeenAt > latest ? entry.lastSeenAt : latest),
        null
      )
      return {
        id: document.id,
        name: document.originalName,
        views,
        avgSeconds,
        lastViewedAt: lastViewedAt?.toISOString() ?? null,
      }
    })
    .sort((a, b) => b.views - a.views)

  // One row per person rather than per visit: the same investor coming back
  // three times is one visitor with three views. Falls back to the visit id
  // so anonymous visits stay separate instead of collapsing into one row.
  const visitorGroups = new Map<string, { name: string | null; email: string | null; visits: Visit[] }>()
  for (const visit of allVisits) {
    const key = visit.visitorEmail || visit.visitorName || visit.id
    const existing = visitorGroups.get(key)
    if (existing) existing.visits.push(visit)
    else visitorGroups.set(key, { name: visit.visitorName, email: visit.visitorEmail, visits: [visit] })
  }
  const visitors: VisitorRow[] = [...visitorGroups.entries()]
    .map(([key, group]) => ({ key, name: group.name, email: group.email, ...aggregate(group.visits, stats) }))
    .sort((a, b) => b.views - a.views)

  const recentViews: RecentViewRow[] = shareLinks
    .flatMap((link) => {
      const targetName = link.document?.originalName ?? link.dataroom?.name ?? "Cible supprimée"
      return link.visits.map((visit) => ({
        id: visit.id,
        visitorLabel: visit.visitorName || visit.visitorEmail || "Visiteur anonyme",
        targetName,
        startedAt: visit.startedAt.toISOString(),
        seconds: stats.get(visit.id)?.activeSeconds ?? 0,
      }))
    })
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, RECENT_VIEWS_LIMIT)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Array.from({ length: CHART_DAYS }, (_, index) => {
    const date = new Date(today)
    date.setDate(date.getDate() - (CHART_DAYS - 1 - index))
    return { date, count: 0 }
  })
  for (const visit of allVisits) {
    const visitDate = new Date(visit.startedAt)
    visitDate.setHours(0, 0, 0, 0)
    const day = days.find((d) => d.date.getTime() === visitDate.getTime())
    if (day) day.count += 1
  }

  return { dailyCounts: days.map((day) => day.count), links, documents: documentRows, visitors, recentViews }
}
