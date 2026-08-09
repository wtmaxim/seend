import { NextResponse } from "next/server"

import { getDocumentAccess } from "@/lib/document-access"
import { prisma } from "@/lib/prisma"
import { buildShareLinkOptions, type ShareLinkOptionsInput } from "@/lib/share-link-create"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getDocumentAccess()
  if (!access?.membership || !access.canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params

  const document = await prisma.document.findFirst({ where: { id, organizationId: access.membership.organizationId } })
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = (await request.json().catch(() => null)) as ShareLinkOptionsInput | null

  const shareLink = await prisma.shareLink.create({
    data: {
      ...buildShareLinkOptions(body),
      documentId: document.id,
      organizationId: access.membership.organizationId,
      createdById: access.session.user.id,
    },
  })

  return NextResponse.json({ id: shareLink.id, token: shareLink.token })
}
