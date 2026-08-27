"use client"

import { Download, FileText, FolderOpen, ImageIcon, Loader2, Trash2 } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Link, useRouter } from "@/i18n/navigation"
import { formatBytes } from "@/lib/format-bytes"

type DocumentDetail = {
  id: string
  originalName: string
  contentType: string
  size: number
  createdAt: string
  uploadedBy: string
}

export function DocumentDetailClient({
  document,
  canManage,
  datarooms,
}: {
  document: DocumentDetail
  canManage: boolean
  datarooms: { id: string; name: string }[]
}) {
  const t = useTranslations("documents")
  const tDatarooms = useTranslations("datarooms")
  const tCommon = useTranslations("common")
  const format = useFormatter()
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isImage = document.contentType.startsWith("image/")

  async function removeDocument() {
    if (!window.confirm(t("deleteConfirm", { name: document.originalName }))) return
    setDeleting(true)
    const response = await fetch(`/api/documents/${document.id}`, { method: "DELETE" })
    if (!response.ok) {
      setError(t("deleteFailed"))
      setDeleting(false)
      return
    }
    router.push("/documents")
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/documents/${document.id}/file`}
            alt={document.originalName}
            className="max-h-[480px] w-full bg-muted/30 object-contain"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 bg-muted/30 py-16">
            <FileText className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("detail.noPreview")}</p>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        {[
          { label: t("detail.type"), value: isImage ? "Image" : "PDF" },
          { label: t("columns.size"), value: formatBytes(document.size, tCommon.raw("bytes") as string[]) },
          { label: t("columns.uploadedBy"), value: document.uploadedBy },
          { label: t("detail.addedOn"), value: format.dateTime(new Date(document.createdAt), { day: "2-digit", month: "2-digit", year: "numeric" }) },
        ].map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 text-sm last:border-b-0"
          >
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-medium text-foreground">{row.value}</span>
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild>
          <a href={`/api/documents/${document.id}/file`} target="_blank" rel="noreferrer">
            {isImage ? <ImageIcon /> : <FileText />}
            {t("detail.open")}
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={`/api/documents/${document.id}/file?download=1`}>
            <Download />
            {t("detail.download")}
          </a>
        </Button>
        {canManage && (
          <Button variant="destructive" disabled={deleting} onClick={() => void removeDocument()}>
            {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
            {t("detail.delete")}
          </Button>
        )}
      </div>

      <div className="rounded-2xl border border-border p-5">
        <div className="mb-3 flex items-center gap-2 text-sm text-foreground/80">
          <FolderOpen className="size-4" />
          <span>{tDatarooms("title")}</span>
        </div>
        {datarooms.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("detail.noDataroom")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {datarooms.map((dataroom) => (
              <Link
                key={dataroom.id}
                href={`/datarooms/${dataroom.id}`}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              >
                {dataroom.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
