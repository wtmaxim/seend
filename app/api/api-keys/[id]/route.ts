import { NextResponse } from "next/server"

import { getDocumentAccess } from "@/lib/document-access"
import { prisma } from "@/lib/prisma"

// Revocation is a soft delete: the row stays so the key list keeps its history,
// and a leaked key can never be resurrected by recreating the same row.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getDocumentAccess()
  if (!access?.membership || !access.canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const result = await prisma.apiKey.updateMany({
    where: { id, organizationId: access.membership.organizationId, revokedAt: null },
    data: { revokedAt: new Date() },
  })

  if (result.count === 0) return NextResponse.json({ error: "Clé introuvable" }, { status: 404 })
  return NextResponse.json({ revoked: true })
}
