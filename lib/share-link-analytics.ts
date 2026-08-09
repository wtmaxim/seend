import { prisma } from "@/lib/prisma"

/**
 * All reads and writes of share-link viewing activity go through this module.
 *
 * Activity is stored as immutable per-heartbeat rows (`ShareLinkPing`) and
 * aggregated at read time, rather than as a running counter updated in
 * place. Nothing outside this file touches the ping table, so swapping the
 * backing store later (e.g. an analytics service such as Tinybird) means
 * reimplementing these three functions, not rewriting the feature.
 */

export type VisitStats = {
  activeSeconds: number
  lastSeenAt: Date
}

/** Append one heartbeat's worth of viewing time. Never updates existing rows. */
export async function recordVisitPing(
  visitId: string,
  seconds: number,
  documentId?: string | null,
  pageNumber?: number | null
): Promise<void> {
  await prisma.shareLinkPing.create({
    data: {
      visitId,
      seconds: Math.max(0, Math.round(seconds)),
      documentId: documentId ?? null,
      pageNumber: pageNumber ?? null,
    },
  })
}

/**
 * When this visit was last known to be active, or null if it has never been
 * pinged. Used to measure the gap since the previous heartbeat.
 */
export async function getLastPingAt(visitId: string): Promise<Date | null> {
  const lastPing = await prisma.shareLinkPing.findFirst({
    where: { visitId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  })
  return lastPing?.createdAt ?? null
}

/**
 * Total active time and last-seen timestamp per visit, aggregated in the
 * database so the caller never loads individual ping rows. Visits with no
 * pings yet are absent from the map — callers fall back to the visit's own
 * startedAt.
 */
export async function getVisitStats(visitIds: string[]): Promise<Map<string, VisitStats>> {
  if (visitIds.length === 0) return new Map()

  const grouped = await prisma.shareLinkPing.groupBy({
    by: ["visitId"],
    where: { visitId: { in: visitIds } },
    _sum: { seconds: true },
    _max: { createdAt: true },
  })

  return new Map(
    grouped.map((row) => [
      row.visitId,
      {
        activeSeconds: row._sum.seconds ?? 0,
        lastSeenAt: row._max.createdAt ?? new Date(0),
      },
    ])
  )
}

/**
 * Total active time per page number for one document, summed across every
 * visit that ever looked at it — whether reached through a link to the
 * document itself or through a dataroom link. Filtering by documentId
 * rather than by visit is what makes that possible: a single dataroom visit
 * can touch several documents, so its visitId alone can't tell which
 * document a given page number belongs to.
 */
export async function getPageStats(documentId: string): Promise<Map<number, number>> {
  const grouped = await prisma.shareLinkPing.groupBy({
    by: ["pageNumber"],
    where: { documentId, pageNumber: { not: null } },
    _sum: { seconds: true },
  })

  return new Map(grouped.map((row) => [row.pageNumber as number, row._sum.seconds ?? 0]))
}
