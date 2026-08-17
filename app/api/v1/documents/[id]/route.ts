import { del, list } from "@vercel/blob"
import { NextResponse } from "next/server"

import { apiError, authenticateApiRequest } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiRequest(request)
  if (auth.response) return auth.response

  const { id } = await params
  const document = await prisma.document.findFirst({
    where: { id, organizationId: auth.context.organizationId },
    select: { id: true, originalName: true, contentType: true, size: true, createdAt: true },
  })
  if (!document) return apiError(404, "Document introuvable")

  return NextResponse.json({ ...document, createdAt: document.createdAt.toISOString() })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiRequest(request)
  if (auth.response) return auth.response
  const { organizationId } = auth.context

  const { id } = await params
  const document = await prisma.document.findFirst({ where: { id, organizationId } })
  if (!document) return apiError(404, "Document introuvable")

  try {
    await del(document.pathname, { token: process.env.BLOB_READ_WRITE_TOKEN })
  } catch (error) {
    console.error("[v1/documents] blob delete failed", error)
    return apiError(502, "La suppression du fichier a échoué")
  }

  // Mirrors the web delete route: cached renders are regenerable, so failing to
  // clear them must not block the deletion itself.
  try {
    const cachePrefix = `organizations/${organizationId}/documents/${document.id}/render-cache/`
    const { blobs } = await list({ prefix: cachePrefix, token: process.env.BLOB_READ_WRITE_TOKEN })
    if (blobs.length > 0) {
      await del(
        blobs.map((blob) => blob.pathname),
        { token: process.env.BLOB_READ_WRITE_TOKEN }
      )
    }
  } catch (error) {
    console.error("[v1/documents] cache cleanup failed", error)
  }

  await prisma.document.delete({ where: { id: document.id } })
  return NextResponse.json({ deleted: true })
}
