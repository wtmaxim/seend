import { headers } from "next/headers"
import { cache } from "react"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DOCUMENT_CONTENT_TYPES, DOCUMENT_EXTENSIONS, MAX_DOCUMENT_SIZE, MAX_DOCUMENTS_PER_BATCH } from "@/lib/document-constants"

export { DOCUMENT_CONTENT_TYPES, DOCUMENT_EXTENSIONS, MAX_DOCUMENT_SIZE, MAX_DOCUMENTS_PER_BATCH }

// Cached per request so the settings layout and its active tab page (both
// Server Components) don't each re-run the session + membership lookup.
export const getDocumentAccess = cache(async function getDocumentAccess() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  const memberships = await prisma.member.findMany({
    where: { userId: session.user.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  })

  const active = session.session.activeOrganizationId
  const membership =
    memberships.find((item) => item.organizationId === active) ?? memberships[0]
  const organizations = memberships.map((item) => ({ id: item.organization.id, name: item.organization.name }))

  if (!membership) return { session, membership: null, organization: null, canManage: false, organizations }

  return {
    session,
    membership,
    organization: membership.organization,
    canManage: membership.role === "owner" || membership.role === "admin",
    organizations,
  }
})

export function serializeDocument(document: {
  id: string
  originalName: string
  contentType: string
  size: number
  createdAt: Date
  uploadedBy?: { name: string | null; email: string } | null
}) {
  return {
    id: document.id,
    originalName: document.originalName,
    contentType: document.contentType,
    size: document.size,
    createdAt: document.createdAt.toISOString(),
    uploadedBy: document.uploadedBy?.name || document.uploadedBy?.email || "Unknown",
  }
}
