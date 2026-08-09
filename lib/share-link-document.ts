import { prisma } from "@/lib/prisma"

/**
 * Resolves which document a share link actually grants access to.
 *
 * A document link only ever grants that one document — the requested id
 * must match exactly. A dataroom link grants every document currently in
 * the dataroom, so membership is checked against DataroomDocument rather
 * than trusting the id in the URL.
 */
export async function resolveShareLinkDocument(
  shareLink: { documentId: string | null; dataroomId: string | null },
  requestedDocumentId: string
) {
  if (shareLink.documentId) {
    if (shareLink.documentId !== requestedDocumentId) return null
    return prisma.document.findUnique({ where: { id: shareLink.documentId } })
  }

  if (shareLink.dataroomId) {
    const membership = await prisma.dataroomDocument.findFirst({
      where: { dataroomId: shareLink.dataroomId, documentId: requestedDocumentId },
      include: { document: true },
    })
    return membership?.document ?? null
  }

  return null
}
