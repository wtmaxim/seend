import { put } from "@vercel/blob"
import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"

import { apiError, authenticateApiRequest } from "@/lib/api-auth"
import {
  DOCUMENT_CONTENT_TYPES,
  DOCUMENT_EXTENSIONS,
  MAX_DOCUMENT_SIZE,
  type DocumentContentType,
} from "@/lib/document-constants"
import { prisma } from "@/lib/prisma"

export const maxDuration = 60

export async function GET(request: Request) {
  const auth = await authenticateApiRequest(request)
  if (auth.response) return auth.response

  const documents = await prisma.document.findMany({
    where: { organizationId: auth.context.organizationId },
    orderBy: { createdAt: "desc" },
    select: { id: true, originalName: true, contentType: true, size: true, createdAt: true },
  })

  return NextResponse.json({
    documents: documents.map((document) => ({
      ...document,
      createdAt: document.createdAt.toISOString(),
    })),
  })
}

/**
 * Uploads a document from the raw request body.
 *
 *   curl -X POST https://seend.co/api/v1/documents \
 *     -H "Authorization: Bearer seend_..." \
 *     -H "Content-Type: application/pdf" \
 *     -H "X-Filename: rapport.pdf" \
 *     --data-binary @rapport.pdf
 */
export async function POST(request: Request) {
  const auth = await authenticateApiRequest(request)
  if (auth.response) return auth.response
  const { organizationId, limits } = auth.context

  const contentType = request.headers.get("content-type")?.split(";")[0]?.trim() || ""
  if (!DOCUMENT_CONTENT_TYPES.includes(contentType as DocumentContentType)) {
    return apiError(400, `Content-Type non supporté. Types acceptés : ${DOCUMENT_CONTENT_TYPES.join(", ")}`)
  }

  const originalName = request.headers.get("x-filename")?.trim().slice(0, 255)
  if (!originalName) return apiError(400, "En-tête X-Filename requis")

  const documentCount = await prisma.document.count({ where: { organizationId } })
  if (documentCount >= limits.documents) {
    return apiError(403, "Limite de documents atteinte pour votre plan")
  }

  const body = await request.arrayBuffer()
  if (body.byteLength === 0) return apiError(400, "Corps de requête vide")
  if (body.byteLength > MAX_DOCUMENT_SIZE) {
    return apiError(413, `Fichier trop volumineux (maximum ${MAX_DOCUMENT_SIZE} octets)`)
  }

  const extension = DOCUMENT_EXTENSIONS[contentType as DocumentContentType]
  const pathname = `organizations/${organizationId}/documents/${randomUUID()}.${extension}`

  let blob
  try {
    blob = await put(pathname, Buffer.from(body), {
      // The blob store is private; documents are only ever served through the
      // authenticated app routes, never by direct blob URL.
      access: "private",
      contentType,
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
  } catch (error) {
    console.error("[v1/documents] blob upload failed", error)
    return apiError(502, "Le stockage du fichier a échoué")
  }

  const document = await prisma.document.create({
    data: {
      organizationId,
      uploadedById: auth.context.actorUserId,
      originalName,
      pathname: blob.pathname,
      contentType,
      size: body.byteLength,
    },
    select: { id: true, originalName: true, contentType: true, size: true, createdAt: true },
  })

  return NextResponse.json(
    { ...document, createdAt: document.createdAt.toISOString() },
    { status: 201 }
  )
}
