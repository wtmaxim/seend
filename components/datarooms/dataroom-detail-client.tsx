"use client"

import { Download, FileText, ImageIcon, Loader2, Plus, Trash2, X } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { useRouter } from "@/i18n/navigation"
import { formatBytes } from "@/lib/format-bytes"

type DocumentItem = { id: string; originalName: string; contentType: string; size: number; createdAt: string; uploadedBy: string }

function DocIcon({ contentType }: { contentType: string }) {
  return contentType.startsWith("image/") ? (
    <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
  ) : (
    <FileText className="size-4 shrink-0 text-muted-foreground" />
  )
}

export function DataroomDetailClient({
  dataroomId,
  documents,
  availableDocuments,
  canManage,
}: {
  dataroomId: string
  documents: DocumentItem[]
  availableDocuments: DocumentItem[]
  canManage: boolean
}) {
  const t = useTranslations("dataroomDetail")
  const tDocuments = useTranslations("documents")
  const tCommon = useTranslations("common")
  const format = useFormatter()
  const router = useRouter()
  const [picking, setPicking] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function addDocument(documentId: string) {
    setPendingId(documentId)
    setError(null)
    const response = await fetch(`/api/datarooms/${dataroomId}/documents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ documentId }),
    })
    setPendingId(null)
    if (!response.ok) return setError(t("addFailed"))
    router.refresh()
  }

  async function removeDocument(documentId: string) {
    setPendingId(documentId)
    setError(null)
    const response = await fetch(`/api/datarooms/${dataroomId}/documents/${documentId}`, { method: "DELETE" })
    setPendingId(null)
    if (!response.ok) return setError(t("removeFailed"))
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setPicking((v) => !v)}>
            {picking ? <X /> : <Plus />}
            {picking ? t("close") : t("addDocuments")}
          </Button>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {picking && (
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="border-b border-border bg-muted/40 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {t("availableDocuments")}
          </div>
          {availableDocuments.length === 0 ? (
            <p className="p-4 text-xs text-muted-foreground">{t("allAlreadyIn")}</p>
          ) : (
            availableDocuments.map((document) => (
              <div key={document.id} className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0">
                <div className="flex min-w-0 items-center gap-3">
                  <DocIcon contentType={document.contentType} />
                  <span className="truncate text-sm">{document.originalName}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(document.size, tCommon.raw("bytes") as string[])}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={pendingId === document.id}
                  onClick={() => void addDocument(document.id)}
                  aria-label={t("add", { name: document.originalName })}
                >
                  {pendingId === document.id ? <Loader2 className="animate-spin" /> : <Plus />}
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {documents.length === 0 ? (
        <div className="rounded-2xl border border-border p-10 text-center">
          <FileText className="mx-auto mb-3 size-7 text-muted-foreground" />
          <p className="text-sm font-medium">{t("emptyTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("emptyDescription")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="hidden grid-cols-[1fr_120px_140px_80px] gap-4 border-b border-border bg-muted/40 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:grid">
            <span>{tDocuments("columns.document")}</span>
            <span>{tDocuments("columns.size")}</span>
            <span>{tDocuments("columns.uploadedBy")}</span>
            <span />
          </div>
          {documents.map((document) => (
            <div key={document.id} className="grid gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_120px_140px_80px] sm:items-center sm:gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <DocIcon contentType={document.contentType} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{document.originalName}</p>
                  <p className="text-xs text-muted-foreground">{format.dateTime(new Date(document.createdAt), { day: "2-digit", month: "2-digit", year: "numeric" })}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{formatBytes(document.size, tCommon.raw("bytes") as string[])}</span>
              <span className="text-xs text-muted-foreground">{document.uploadedBy}</span>
              <div className="flex items-center justify-end gap-1">
                <Button asChild variant="ghost" size="icon-xs">
                  <a href={`/api/documents/${document.id}/file`} target="_blank" rel="noreferrer" aria-label={tDocuments("open", { name: document.originalName })}>
                    <FileText />
                  </a>
                </Button>
                <Button asChild variant="ghost" size="icon-xs">
                  <a href={`/api/documents/${document.id}/file?download=1`} aria-label={tDocuments("download", { name: document.originalName })}>
                    <Download />
                  </a>
                </Button>
                {canManage && (
                  <Button
                    variant="destructive"
                    size="icon-xs"
                    disabled={pendingId === document.id}
                    onClick={() => void removeDocument(document.id)}
                    aria-label={t("remove", { name: document.originalName })}
                  >
                    {pendingId === document.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
