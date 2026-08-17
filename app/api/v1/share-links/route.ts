import { NextResponse } from "next/server"

import { apiError, authenticateApiRequest } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { buildShareLinkOptions, type ShareLinkOptionsInput } from "@/lib/share-link-create"

type CreateBody = ShareLinkOptionsInput & { documentId?: string; dataroomId?: string }

export async function GET(request: Request) {
  const auth = await authenticateApiRequest(request)
  if (auth.response) return auth.response

  const shareLinks = await prisma.shareLink.findMany({
    where: { organizationId: auth.context.organizationId, revoked: false },
    include: { _count: { select: { visits: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({
    shareLinks: shareLinks.map((link) => ({
      id: link.id,
      token: link.token,
      label: link.label,
      documentId: link.documentId,
      dataroomId: link.dataroomId,
      expiresAt: link.expiresAt?.toISOString() ?? null,
      requireName: link.requireName,
      requireEmail: link.requireEmail,
      allowedEmails: link.allowedEmails,
      watermark: link.watermark,
      visitCount: link._count.visits,
      createdAt: link.createdAt.toISOString(),
    })),
  })
}

/**
 * Creates a share link for exactly one of `documentId` or `dataroomId`.
 * Remaining fields (label, expiresInDays, requireName, requireEmail,
 * allowedEmails, watermark) match the web app's options.
 */
export async function POST(request: Request) {
  const auth = await authenticateApiRequest(request)
  if (auth.response) return auth.response
  const { organizationId, actorUserId } = auth.context

  const body = (await request.json().catch(() => null)) as CreateBody | null
  const documentId = body?.documentId
  const dataroomId = body?.dataroomId

  if (Boolean(documentId) === Boolean(dataroomId)) {
    return apiError(400, "Fournis exactement un des champs documentId ou dataroomId")
  }

  if (documentId) {
    const document = await prisma.document.findFirst({ where: { id: documentId, organizationId } })
    if (!document) return apiError(404, "Document introuvable")
  } else {
    const dataroom = await prisma.dataroom.findFirst({ where: { id: dataroomId, organizationId } })
    if (!dataroom) return apiError(404, "Dataroom introuvable")
  }

  const shareLink = await prisma.shareLink.create({
    data: {
      ...buildShareLinkOptions(body),
      documentId: documentId ?? null,
      dataroomId: dataroomId ?? null,
      organizationId,
      createdById: actorUserId,
    },
    select: { id: true, token: true, expiresAt: true, createdAt: true },
  })

  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000"
  return NextResponse.json(
    {
      id: shareLink.id,
      token: shareLink.token,
      url: `${baseUrl}/view/${shareLink.token}`,
      expiresAt: shareLink.expiresAt?.toISOString() ?? null,
      createdAt: shareLink.createdAt.toISOString(),
    },
    { status: 201 }
  )
}
