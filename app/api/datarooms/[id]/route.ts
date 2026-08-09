import { NextResponse } from "next/server"

import { getDocumentAccess } from "@/lib/document-access"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getDocumentAccess()
  if (!access?.membership || !access.canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params

  const existing = await prisma.dataroom.findFirst({ where: { id, organizationId: access.membership.organizationId } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = (await request.json().catch(() => null)) as { name?: string; description?: string } | null
  const data: { name?: string; description?: string | null } = {}
  if (typeof body?.name === "string") {
    const name = body.name.trim().slice(0, 255)
    if (!name) return NextResponse.json({ error: "Le nom est requis" }, { status: 400 })
    data.name = name
  }
  if (typeof body?.description === "string") {
    data.description = body.description.trim().slice(0, 500) || null
  }

  await prisma.dataroom.update({ where: { id }, data })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getDocumentAccess()
  if (!access?.membership || !access.canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params

  const existing = await prisma.dataroom.findFirst({ where: { id, organizationId: access.membership.organizationId } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.dataroom.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
