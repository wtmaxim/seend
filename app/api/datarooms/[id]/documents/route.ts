import { NextResponse } from "next/server"

import { getDocumentAccess } from "@/lib/document-access"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getDocumentAccess()
  if (!access?.membership || !access.canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params

  const dataroom = await prisma.dataroom.findFirst({ where: { id, organizationId: access.membership.organizationId } })
  if (!dataroom) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = (await request.json().catch(() => null)) as { documentId?: string } | null
  if (!body?.documentId) return NextResponse.json({ error: "documentId requis" }, { status: 400 })

  const document = await prisma.document.findFirst({
    where: { id: body.documentId, organizationId: access.membership.organizationId },
  })
  if (!document) return NextResponse.json({ error: "Document introuvable" }, { status: 404 })

  await prisma.dataroomDocument.upsert({
    where: { dataroomId_documentId: { dataroomId: id, documentId: document.id } },
    create: { dataroomId: id, documentId: document.id },
    update: {},
  })

  return NextResponse.json({ ok: true })
}
