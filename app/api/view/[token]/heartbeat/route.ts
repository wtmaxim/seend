import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/request-ip"
import { getLastPingAt, recordVisitPing } from "@/lib/share-link-analytics"
import {
  SHARE_VISIT_COOKIE_MAX_AGE_SECONDS,
  SHARE_VISIT_SESSION_TIMEOUT_SECONDS,
  isShareLinkActive,
  shareVisitCookieName,
} from "@/lib/share-link"
import { resolveShareLinkDocument } from "@/lib/share-link-document"

// The client pings roughly every 10s while the tab is visible. Capping the
// per-ping increment slightly above that absorbs normal jitter (a slightly
// delayed ping still counts its real interval) without letting a single
// ping over-credit active time.
const MAX_HEARTBEAT_GAP_SECONDS = 15

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const ip = getClientIp(request.headers) || "unknown"

    const rateLimit = await checkRateLimit(`view:heartbeat:${ip}`, 60, 300)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes" },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      )
    }

    const shareLink = await prisma.shareLink.findUnique({ where: { token } })
    if (!shareLink || !isShareLinkActive(shareLink)) {
      return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 })
    }

    const cookieStore = await cookies()
    const visitId = cookieStore.get(shareVisitCookieName(token))?.value
    if (!visitId) return NextResponse.json({ error: "Session de visite manquante" }, { status: 401 })

    const visit = await prisma.shareLinkVisit.findFirst({ where: { id: visitId, shareLinkId: shareLink.id } })
    if (!visit) return NextResponse.json({ error: "Session de visite invalide" }, { status: 401 })

    const body = (await request.json().catch(() => null)) as { documentId?: string; pageNumber?: number } | null
    const pageNumber =
      typeof body?.pageNumber === "number" && Number.isInteger(body.pageNumber) && body.pageNumber > 0
        ? body.pageNumber
        : null
    // Don't trust the client's documentId at face value — confirm it's
    // actually the document (or one of the dataroom's documents) this link
    // grants access to, same check the page-rendering route makes.
    const resolvedDocument = body?.documentId ? await resolveShareLinkDocument(shareLink, body.documentId) : null
    const documentId = resolvedDocument?.id ?? null

    // Measure from the previous heartbeat, falling back to when the visit
    // was opened if this is the first one.
    const lastActivityAt = (await getLastPingAt(visit.id)) ?? visit.startedAt
    const gapSeconds = (Date.now() - lastActivityAt.getTime()) / 1000

    // The visitor's identity cookie is still valid, but they've been away
    // long enough that this isn't the same viewing session anymore. Start a
    // new visit with the same identity so the visit list shows two distinct
    // sessions rather than one spanning the idle time between them.
    if (gapSeconds > SHARE_VISIT_SESSION_TIMEOUT_SECONDS) {
      const newVisit = await prisma.shareLinkVisit.create({
        data: {
          shareLinkId: shareLink.id,
          visitorEmail: visit.visitorEmail,
          visitorName: visit.visitorName,
          ipAddress: ip === "unknown" ? visit.ipAddress : ip,
          userAgent: request.headers.get("user-agent") || visit.userAgent,
        },
      })
      const response = NextResponse.json({ ok: true })
      response.cookies.set(shareVisitCookieName(token), newVisit.id, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: SHARE_VISIT_COOKIE_MAX_AGE_SECONDS,
      })
      return response
    }

    await recordVisitPing(visit.id, Math.min(gapSeconds, MAX_HEARTBEAT_GAP_SECONDS), documentId, pageNumber)
    return NextResponse.json({ ok: true })
  } catch (error) {
    // Heartbeat pings are fire-and-forget on the client (sendBeacon / fetch
    // without awaiting the body), so a thrown error here would otherwise
    // fail completely silently and just stall the recorded duration.
    console.error("[view/heartbeat] failed", error)
    return NextResponse.json({ error: "Heartbeat failed" }, { status: 500 })
  }
}
