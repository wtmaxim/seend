import { NextResponse } from "next/server"

import { getDocumentAccess } from "@/lib/document-access"
import { prisma } from "@/lib/prisma"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getDocumentAccess()
  if (!access?.membership || !access.canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params

  const shareLink = await prisma.shareLink.findFirst({ where: { id, organizationId: access.membership.organizationId } })
  if (!shareLink) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.shareLink.update({ where: { id }, data: { revoked: true } })
  return NextResponse.json({ ok: true })
}
