import { NextResponse } from "next/server"

import { apiError, authenticateApiRequest } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiRequest(request)
  if (auth.response) return auth.response
  const { organizationId } = auth.context

  const { id } = await params
  const dataroom = await prisma.dataroom.findFirst({ where: { id, organizationId } })
  if (!dataroom) return apiError(404, "Dataroom introuvable")

  const body = (await request.json().catch(() => null)) as { documentId?: string } | null
  if (!body?.documentId) return apiError(400, "Le champ documentId est requis")

  const document = await prisma.document.findFirst({
    where: { id: body.documentId, organizationId },
  })
  if (!document) return apiError(404, "Document introuvable")

  await prisma.dataroomDocument.upsert({
    where: { dataroomId_documentId: { dataroomId: id, documentId: document.id } },
    create: { dataroomId: id, documentId: document.id },
    update: {},
  })

  return NextResponse.json({ added: true })
}
