import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { getDocumentPageCount, renderDocumentPage } from "@/lib/document-render"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/request-ip"
import { isShareLinkActive, shareVisitCookieName } from "@/lib/share-link"
import { resolveShareLinkDocument } from "@/lib/share-link-document"
import { buildWatermarkLabel } from "@/lib/share-link-watermark"

// Rendering a page is CPU-bound and can take a few seconds on large PDFs.
export const maxDuration = 60

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string; documentId: string; number: string }> }
) {
  const { token, documentId, number } = await params
  const pageNumber = Number(number)
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    return NextResponse.json({ error: "Page invalide" }, { status: 400 })
  }

  const ip = getClientIp(request.headers) || "unknown"
  const rateLimit = await checkRateLimit(`view:render:${ip}`, 90, 300)
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
  if (!visitId) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  const visit = await prisma.shareLinkVisit.findFirst({ where: { id: visitId, shareLinkId: shareLink.id } })
  if (!visit) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  const document = await resolveShareLinkDocument(shareLink, documentId)
  if (!document) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  try {
    // Asking for a page that doesn't exist is a bad request, not a server
    // fault, and the count is cached after the first view so this check is
    // a plain column read.
    const pageCount = await getDocumentPageCount(document)
    if (pageNumber > pageCount) {
      return NextResponse.json({ error: "Page introuvable" }, { status: 404 })
    }

    const jpeg = await renderDocumentPage({
      documentId: document.id,
      organizationId: document.organizationId,
      pathname: document.pathname,
      contentType: document.contentType,
      pageNumber,
      watermarkLabel: shareLink.watermark ? buildWatermarkLabel(visit) : null,
    })

    return new Response(jpeg as BodyInit, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(jpeg.length),
        // The render is specific to this visitor, so it may be cached by
        // their browser but never by a shared cache. Vary on cookie so a
        // different visit never reuses another visitor's watermarked page.
        "Cache-Control": "private, max-age=3600",
        Vary: "Cookie",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    console.error("[view/page] render failed", error)
    return NextResponse.json({ error: "Rendu impossible" }, { status: 500 })
  }
}
