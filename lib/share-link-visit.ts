import { cookies } from "next/headers"

import { prisma } from "@/lib/prisma"
import { shareVisitCookieName } from "@/lib/share-link"

/**
 * The visit tied to this browser's cookie for this link, or null if it
 * hasn't passed the gate yet (or the cookie points at a different link).
 * Shared by every view-side page so "am I allowed in" is checked one way.
 */
export async function getActiveVisit(shareLinkId: string, token: string) {
  const cookieStore = await cookies()
  const visitId = cookieStore.get(shareVisitCookieName(token))?.value
  if (!visitId) return null
  return prisma.shareLinkVisit.findFirst({ where: { id: visitId, shareLinkId } })
}
