import { NextResponse } from "next/server"

import { apiError, authenticateApiRequest } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  const auth = await authenticateApiRequest(request)
  if (auth.response) return auth.response

  const { id, documentId } = await params
  const dataroom = await prisma.dataroom.findFirst({
    where: { id, organizationId: auth.context.organizationId },
  })
  if (!dataroom) return apiError(404, "Dataroom introuvable")

  // Only unlinks the document from the dataroom; the document itself is
  // untouched, matching the web behaviour.
  await prisma.dataroomDocument.deleteMany({ where: { dataroomId: id, documentId } })
  return NextResponse.json({ removed: true })
}
