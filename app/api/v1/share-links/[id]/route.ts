import { NextResponse } from "next/server"

import { apiError, authenticateApiRequest } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiRequest(request)
  if (auth.response) return auth.response

  const { id } = await params
  const result = await prisma.shareLink.updateMany({
    where: { id, organizationId: auth.context.organizationId, revoked: false },
    data: { revoked: true },
  })
  if (result.count === 0) return apiError(404, "Lien de partage introuvable")

  return NextResponse.json({ revoked: true })
}
