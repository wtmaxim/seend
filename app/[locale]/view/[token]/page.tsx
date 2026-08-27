import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { Link } from "@/i18n/navigation"
import { FileText, ImageIcon } from "lucide-react"

import { DocumentViewer } from "@/components/view/document-viewer"
import { Heartbeat } from "@/components/view/heartbeat"
import { TooManyRequests } from "@/components/view/too-many-requests"
import { VisitGate } from "@/components/view/visit-gate"
import { getDocumentPageCount } from "@/lib/document-render"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/request-ip"
import { isShareLinkActive } from "@/lib/share-link"
import { getActiveVisit } from "@/lib/share-link-visit"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta.sharedDocument")
  return { title: t("title") }
}

async function LinkUnavailable() {
  const t = await getTranslations("view")

  return (
    <main className="flex min-h-svh items-center justify-center p-6 text-center">
      <div>
        <p className="text-sm font-medium text-foreground">{t("linkUnavailable")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("linkUnavailableHint")}</p>
      </div>
    </main>
  )
}

export default async function ViewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const t = await getTranslations("view")

  const ip = getClientIp(await headers()) || "unknown"
  const rateLimit = await checkRateLimit(`view:token:${ip}`, 30, 300)
  if (!rateLimit.allowed) return <TooManyRequests />

  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    include: {
      document: true,
      dataroom: { include: { documents: { include: { document: true }, orderBy: { addedAt: "desc" } } } },
    },
  })

  if (!shareLink || !isShareLinkActive(shareLink)) return <LinkUnavailable />
  if (!shareLink.document && !shareLink.dataroom) return <LinkUnavailable />

  const visit = await getActiveVisit(shareLink.id, token)

  if (!visit) {
    return (
      <VisitGate
        token={token}
        title={shareLink.document?.originalName ?? shareLink.dataroom!.name}
        kind={shareLink.document ? "document" : "dataroom"}
        requireName={shareLink.requireName}
        requireEmail={shareLink.requireEmail}
      />
    )
  }

  if (shareLink.dataroom) {
    return (
      <main className="min-h-svh bg-background p-4 sm:p-8">
        <Heartbeat token={token} />
        <div className="mx-auto max-w-2xl space-y-4">
          <div>
            <h1 className="text-lg font-medium text-foreground">{shareLink.dataroom.name}</h1>
            {shareLink.dataroom.description && (
              <p className="mt-1 text-sm text-muted-foreground">{shareLink.dataroom.description}</p>
            )}
          </div>
          <div className="overflow-hidden rounded-2xl border border-border">
            {shareLink.dataroom.documents.length === 0 ? (
              <p className="p-10 text-center text-xs text-muted-foreground">
                {t("emptyDataroom")}
              </p>
            ) : (
              shareLink.dataroom.documents.map(({ document }) => (
                <Link
                  key={document.id}
                  href={`/view/${token}/${document.id}`}
                  className="flex items-center gap-3 border-b border-border px-4 py-3 text-sm text-foreground transition-colors last:border-b-0 hover:bg-muted/40"
                >
                  {document.contentType.startsWith("image/") ? (
                    <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate">{document.originalName}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    )
  }

  const document = shareLink.document!
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
        <h1 className="truncate text-sm font-medium text-muted-foreground">{document.originalName}</h1>
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
