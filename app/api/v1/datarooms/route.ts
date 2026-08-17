import { NextResponse } from "next/server"

import { apiError, authenticateApiRequest } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const auth = await authenticateApiRequest(request)
  if (auth.response) return auth.response

  const datarooms = await prisma.dataroom.findMany({
    where: { organizationId: auth.context.organizationId },
    include: { _count: { select: { documents: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({
    datarooms: datarooms.map((dataroom) => ({
      id: dataroom.id,
      name: dataroom.name,
      description: dataroom.description,
      documentCount: dataroom._count.documents,
      createdAt: dataroom.createdAt.toISOString(),
    })),
  })
}

export async function POST(request: Request) {
  const auth = await authenticateApiRequest(request)
  if (auth.response) return auth.response
  const { organizationId, limits, actorUserId } = auth.context

  const body = (await request.json().catch(() => null)) as { name?: string; description?: string } | null
  const name = body?.name?.trim().slice(0, 255)
  if (!name) return apiError(400, "Le champ name est requis")
  const description = body?.description?.trim().slice(0, 500) || null

  const dataroomCount = await prisma.dataroom.count({ where: { organizationId } })
  if (dataroomCount >= limits.datarooms) {
    return apiError(403, "Limite de datarooms atteinte pour votre plan")
  }

  const dataroom = await prisma.dataroom.create({
    data: { organizationId, createdById: actorUserId, name, description },
    select: { id: true, name: true, description: true, createdAt: true },
  })

  return NextResponse.json({ ...dataroom, createdAt: dataroom.createdAt.toISOString() }, { status: 201 })
}
