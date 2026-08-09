import { del, list } from "@vercel/blob"
import { NextResponse } from "next/server"

import { getDocumentAccess } from "@/lib/document-access"
import { prisma } from "@/lib/prisma"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getDocumentAccess()
  if (!access?.membership) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!access.canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const document = await prisma.document.findFirst({ where: { id, organizationId: access.membership.organizationId } })
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 })
  try {
    await del(document.pathname, { token: process.env.BLOB_READ_WRITE_TOKEN })
  } catch {
    return NextResponse.json({ error: "Unable to delete blob" }, { status: 502 })
  }
  // Best-effort: cached page renders are derived and regenerable, so a
  // failure here shouldn't block deleting the document itself.
  try {
    const cachePrefix = `organizations/${access.membership.organizationId}/documents/${document.id}/render-cache/`
    const { blobs } = await list({ prefix: cachePrefix, token: process.env.BLOB_READ_WRITE_TOKEN })
    if (blobs.length > 0) {
      await del(
        blobs.map((blob) => blob.pathname),
        { token: process.env.BLOB_READ_WRITE_TOKEN }
      )
    }
  } catch (error) {
    console.error("[documents/delete] cache cleanup failed", error)
  }
  await prisma.document.delete({ where: { id: document.id } })
  return NextResponse.json({ ok: true })
}
