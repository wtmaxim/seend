import { handleUpload } from "@vercel/blob/client"
import { NextResponse } from "next/server"

import {
  DOCUMENT_CONTENT_TYPES,
  DOCUMENT_EXTENSIONS,
  MAX_DOCUMENT_SIZE,
  getDocumentAccess,
} from "@/lib/document-access"
import type { DocumentContentType } from "@/lib/document-constants"
import { getOrganizationLimits } from "@/lib/plan-limits"
import { prisma } from "@/lib/prisma"

type TokenPayload = {
  organizationId: string
  userId: string
  originalName: string
}

async function persistDocument(pathname: string, payload: TokenPayload, blob: { contentType?: string; size?: number; etag?: string }) {
  if (!pathname.startsWith(`organizations/${payload.organizationId}/documents/`)) {
    throw new Error("Invalid document path")
  }

  return prisma.document.upsert({
    where: { pathname },
    create: {
      organizationId: payload.organizationId,
      uploadedById: payload.userId,
      originalName: payload.originalName,
      pathname,
      contentType: blob.contentType || "application/octet-stream",
      size: blob.size || 0,
      etag: blob.etag,
    },
    update: {
      originalName: payload.originalName,
      contentType: blob.contentType || "application/octet-stream",
      size: blob.size || 0,
      etag: blob.etag,
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const access = await getDocumentAccess()
        if (!access?.membership || !access.canManage) throw new Error("Forbidden")
        if (!pathname.startsWith(`organizations/${access.membership.organizationId}/documents/`)) {
          throw new Error("Invalid pathname")
        }

        const limits = await getOrganizationLimits(access.membership.organizationId)
        const documentCount = await prisma.document.count({ where: { organizationId: access.membership.organizationId } })
        if (documentCount >= limits.documents) throw new Error("Limite de documents atteinte pour votre plan")

        let parsed: { originalName?: unknown; size?: unknown; contentType?: unknown } = {}
        try {
          parsed = clientPayload ? JSON.parse(clientPayload) : {}
        } catch {
          throw new Error("Invalid upload payload")
        }
        if (
          typeof parsed.contentType !== "string" ||
          !DOCUMENT_CONTENT_TYPES.includes(parsed.contentType as DocumentContentType) ||
          typeof parsed.size !== "number" ||
          parsed.size <= 0 ||
          parsed.size > MAX_DOCUMENT_SIZE
        ) {
          throw new Error("Invalid file")
        }
        const expectedExtension = DOCUMENT_EXTENSIONS[parsed.contentType as DocumentContentType]
        if (!pathname.endsWith(`.${expectedExtension}`)) {
          throw new Error("Invalid pathname")
        }

        return {
          allowedContentTypes: [...DOCUMENT_CONTENT_TYPES],
          maximumSizeInBytes: MAX_DOCUMENT_SIZE,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({
            organizationId: access.membership.organizationId,
            userId: access.session.user.id,
            originalName: typeof parsed.originalName === "string" ? parsed.originalName.slice(0, 255) : "document",
          } satisfies TokenPayload),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        if (!tokenPayload) return
        await persistDocument(blob.pathname, JSON.parse(tokenPayload) as TokenPayload, blob)
      },
    })
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed"
    const status = message === "Forbidden" ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
