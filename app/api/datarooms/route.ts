import { NextResponse } from "next/server"

import { getDocumentAccess } from "@/lib/document-access"
import { getOrganizationLimits } from "@/lib/plan-limits"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const access = await getDocumentAccess()
  if (!access?.membership || !access.canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = (await request.json().catch(() => null)) as { name?: string; description?: string } | null
  const name = body?.name?.trim().slice(0, 255)
  if (!name) return NextResponse.json({ error: "Le nom est requis" }, { status: 400 })
  const description = body?.description?.trim().slice(0, 500) || null

  const limits = await getOrganizationLimits(access.membership.organizationId)
  const dataroomCount = await prisma.dataroom.count({ where: { organizationId: access.membership.organizationId } })
  if (dataroomCount >= limits.datarooms) {
    return NextResponse.json({ error: "Limite de datarooms atteinte pour votre plan" }, { status: 403 })
  }

  const dataroom = await prisma.dataroom.create({
    data: {
      organizationId: access.membership.organizationId,
      createdById: access.session.user.id,
      name,
      description,
    },
  })

  return NextResponse.json({ id: dataroom.id })
}
