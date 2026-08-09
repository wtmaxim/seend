import { head } from "@vercel/blob"
import { NextResponse } from "next/server"

import { DOCUMENT_CONTENT_TYPES, MAX_DOCUMENT_SIZE, getDocumentAccess } from "@/lib/document-access"
import type { DocumentContentType } from "@/lib/document-constants"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const access = await getDocumentAccess()
    if (!access?.membership || !access.canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const body = (await request.json()) as { pathname?: string; originalName?: string; size?: number }
    if (!body.pathname || !body.pathname.startsWith(`organizations/${access.membership.organizationId}/documents/`)) {
      return NextResponse.json({ error: "Invalid pathname" }, { status: 400 })
    }
    const blob = await head(body.pathname, { token: process.env.BLOB_READ_WRITE_TOKEN })
    if (!DOCUMENT_CONTENT_TYPES.includes(blob.contentType as DocumentContentType) || blob.size <= 0 || blob.size > MAX_DOCUMENT_SIZE) {
      console.error("[documents/complete] Invalid file", { pathname: body.pathname, contentType: blob.contentType, size: blob.size })
      return NextResponse.json({ error: "Invalid file" }, { status: 400 })
    }
    const document = await prisma.document.upsert({
      where: { pathname: body.pathname },
      create: { organizationId: access.membership.organizationId, uploadedById: access.session.user.id, originalName: body.originalName?.slice(0, 255) || "document", pathname: body.pathname, contentType: blob.contentType, size: blob.size, etag: blob.etag },
      update: { size: blob.size, contentType: blob.contentType, etag: blob.etag },
    })
    return NextResponse.json({ id: document.id })
  } catch (error) {
    console.error("[documents/complete] Unable to finalize upload", error)
    return NextResponse.json({ error: "Unable to finalize upload" }, { status: 400 })
  }
}
