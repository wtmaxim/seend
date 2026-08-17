import { NextResponse } from "next/server"

import { generateApiKey } from "@/lib/api-key"
import { getDocumentAccess } from "@/lib/document-access"
import { getOrganizationLimits } from "@/lib/plan-limits"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const access = await getDocumentAccess()
  if (!access?.membership || !access.canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const limits = await getOrganizationLimits(access.membership.organizationId)
  if (!limits.api) {
    return NextResponse.json({ error: "L'accès API nécessite le plan Business" }, { status: 403 })
  }

  const body = (await request.json().catch(() => null)) as { name?: string } | null
  const name = body?.name?.trim().slice(0, 60)
  if (!name) return NextResponse.json({ error: "Le nom est requis" }, { status: 400 })

  const { key, hash, hint } = generateApiKey()
  const created = await prisma.apiKey.create({
    data: {
      organizationId: access.membership.organizationId,
      createdById: access.session.user.id,
      name,
      hash,
      hint,
    },
    select: { id: true, name: true, hint: true, createdAt: true },
  })

  // The only time the plaintext key ever leaves the server.
  return NextResponse.json({ ...created, createdAt: created.createdAt.toISOString(), key })
}
