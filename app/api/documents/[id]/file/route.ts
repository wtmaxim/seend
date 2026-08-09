import { get } from "@vercel/blob"
import { NextResponse } from "next/server"

import { getDocumentAccess } from "@/lib/document-access"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getDocumentAccess()
  if (!access?.membership) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const document = await prisma.document.findFirst({ where: { id, organizationId: access.membership.organizationId } })
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const result = await get(document.pathname, {
    access: "private",
    token: process.env.BLOB_READ_WRITE_TOKEN,
    ifNoneMatch: request.headers.get("if-none-match") || undefined,
  })
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (result.statusCode === 304) return new Response(null, { status: 304 })
  const download = new URL(request.url).searchParams.get("download") === "1"
  return new Response(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType || "application/pdf",
      "Content-Length": String(result.blob.size),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(document.originalName)}`,
      "Cache-Control": "private, no-cache",
      "ETag": result.blob.etag,
      "X-Content-Type-Options": "nosniff",
    },
  })
}
