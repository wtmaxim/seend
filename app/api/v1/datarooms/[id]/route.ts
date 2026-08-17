import { NextResponse } from "next/server"

import { apiError, authenticateApiRequest } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiRequest(request)
  if (auth.response) return auth.response

  const { id } = await params
  const dataroom = await prisma.dataroom.findFirst({
    where: { id, organizationId: auth.context.organizationId },
    include: {
      documents: {
        include: { document: { select: { id: true, originalName: true, contentType: true, size: true } } },
        orderBy: { addedAt: "desc" },
      },
    },
  })
  if (!dataroom) return apiError(404, "Dataroom introuvable")

  return NextResponse.json({
    id: dataroom.id,
    name: dataroom.name,
    description: dataroom.description,
    createdAt: dataroom.createdAt.toISOString(),
    documents: dataroom.documents.map((link) => link.document),
  })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiRequest(request)
  if (auth.response) return auth.response

  const { id } = await params
  const result = await prisma.dataroom.deleteMany({
    where: { id, organizationId: auth.context.organizationId },
  })
  if (result.count === 0) return apiError(404, "Dataroom introuvable")

  return NextResponse.json({ deleted: true })
}
