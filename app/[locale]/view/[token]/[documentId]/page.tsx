import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { Link } from "@/i18n/navigation"
import { notFound } from "next/navigation"

import { DocumentViewer } from "@/components/view/document-viewer"
import { TooManyRequests } from "@/components/view/too-many-requests"
import { VisitGate } from "@/components/view/visit-gate"
import { getDocumentPageCount } from "@/lib/document-render"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/request-ip"
import { isShareLinkActive } from "@/lib/share-link"
import { resolveShareLinkDocument } from "@/lib/share-link-document"
import { getActiveVisit } from "@/lib/share-link-visit"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta.sharedDocument")
  return { title: t("title") }
}

export default async function DataroomDocumentPage({
  params,
}: {
  params: Promise<{ token: string; documentId: string }>
}) {
  const { token, documentId } = await params
  const t = await getTranslations("view")

  const ip = getClientIp(await headers()) || "unknown"
  const rateLimit = await checkRateLimit(`view:token:${ip}`, 30, 300)
  if (!rateLimit.allowed) return <TooManyRequests />

  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    include: { dataroom: { select: { name: true } } },
  })

  if (!shareLink || !isShareLinkActive(shareLink) || !shareLink.dataroomId) {
    return (
      <main className="flex min-h-svh items-center justify-center p-6 text-center">
        <div>
          <p className="text-sm font-medium text-foreground">{t("linkUnavailable")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("linkUnavailableHint")}</p>
        </div>
      </main>
    )
  }

  const visit = await getActiveVisit(shareLink.id, token)
  if (!visit) {
    return (
      <VisitGate
        token={token}
        title={shareLink.dataroom!.name}
        kind="dataroom"
        requireName={shareLink.requireName}
        requireEmail={shareLink.requireEmail}
      />
    )
  }

  const document = await resolveShareLinkDocument(shareLink, documentId)
  if (!document) notFound()

  let pageCount = 0
  let renderError = false
  try {
    pageCount = await getDocumentPageCount(document)
  } catch (error) {
    console.error("[view] page count failed", error)
    renderError = true
  }

  return (
    <main className="min-h-svh bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-4">
        <div>
          <Link href={`/view/${token}`} className="text-xs text-muted-foreground hover:text-foreground">
            ← {shareLink.dataroom!.name}
          </Link>
          <h1 className="mt-1 truncate text-sm font-medium text-muted-foreground">{document.originalName}</h1>
        </div>
        {renderError ? (
          <div className="rounded-2xl border border-border p-10 text-center">
            <p className="text-sm text-foreground">{t("documentUnavailable")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("documentUnavailableHint")}</p>
          </div>
        ) : (
          <DocumentViewer
            token={token}
            documentId={document.id}
            pageCount={pageCount}
            documentName={document.originalName}
          />
        )}
      </div>
    </main>
  )
}
