import { NextResponse } from "next/server"

import { getDocumentAccess } from "@/lib/document-access"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  const access = await getDocumentAccess()
  if (!access?.membership || !access.canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id, documentId } = await params

  const dataroom = await prisma.dataroom.findFirst({ where: { id, organizationId: access.membership.organizationId } })
  if (!dataroom) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.dataroomDocument.deleteMany({ where: { dataroomId: id, documentId } })
  return NextResponse.json({ ok: true })
}
