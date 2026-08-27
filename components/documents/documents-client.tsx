"use client"

import { upload } from "@vercel/blob/client"
import { Download, FileText, ImageIcon, Loader2, Trash2, UploadCloud } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Link, useRouter } from "@/i18n/navigation"
import { DOCUMENT_CONTENT_TYPES, DOCUMENT_EXTENSIONS, MAX_DOCUMENT_SIZE, MAX_DOCUMENTS_PER_BATCH } from "@/lib/document-constants"
import type { DocumentContentType } from "@/lib/document-constants"
import { formatBytes } from "@/lib/format-bytes"

type DocumentItem = { id: string; originalName: string; contentType: string; size: number; createdAt: string; uploadedBy: string }
type UploadItem = { id: string; name: string; progress: number; status: "uploading" | "done" | "error"; error?: string }

export function DocumentsClient({ documents, canManage, organizationId }: { documents: DocumentItem[]; canManage: boolean; organizationId: string }) {
  const t = useTranslations("documents")
  const tCommon = useTranslations("common")
  const format = useFormatter()
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [dragging, setDragging] = useState(false)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const byteUnits = tCommon.raw("bytes") as string[]
  const maxSizeLabel = formatBytes(MAX_DOCUMENT_SIZE, byteUnits)

  async function startUpload(files: FileList | File[]) {
    const selected = Array.from(files)
    setError(null)
    if (selected.length > MAX_DOCUMENTS_PER_BATCH) return setError(t("tooManyFiles", { max: MAX_DOCUMENTS_PER_BATCH }))
    const invalid = selected.find((file) => !DOCUMENT_CONTENT_TYPES.includes(file.type as DocumentContentType) || file.size <= 0 || file.size > MAX_DOCUMENT_SIZE)
    if (invalid) return setError(t("invalidFile", { name: invalid.name, max: maxSizeLabel }))
    const items = selected.map((file) => ({ id: crypto.randomUUID(), name: file.name, progress: 0, status: "uploading" as const }))
    setUploads(items)
    await Promise.all(selected.map(async (file, index) => {
      const item = items[index]
      try {
        const extension = DOCUMENT_EXTENSIONS[file.type as DocumentContentType]
        const pathname = `organizations/${organizationId}/documents/${crypto.randomUUID()}.${extension}`
        const blob = await upload(pathname, file, {
          access: "private",
          handleUploadUrl: "/api/documents/upload",
          clientPayload: JSON.stringify({ originalName: file.name, contentType: file.type, size: file.size }),
          multipart: file.size > 5 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => setUploads((current) => current.map((entry) => entry.id === item.id ? { ...entry, progress: percentage } : entry)),
        })
        const completion = await fetch("/api/documents/complete", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pathname: blob.pathname, originalName: file.name, size: file.size }) })
        if (!completion.ok) throw new Error(t("finalizeFailed"))
        setUploads((current) => current.map((entry) => entry.id === item.id ? { ...entry, progress: 100, status: "done" } : entry))
      } catch (uploadError) {
        setUploads((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: "error", error: uploadError instanceof Error ? uploadError.message : t("uploadFailed") } : entry))
      }
    }))
    router.refresh()
  }

  async function removeDocument(document: DocumentItem) {
    if (!window.confirm(t("deleteConfirm", { name: document.originalName }))) return
    setDeleting(document.id)
    const response = await fetch(`/api/documents/${document.id}`, { method: "DELETE" })
    if (!response.ok) setError(t("deleteFailed"))
    setDeleting(null)
    router.refresh()
  }

  return <div className="space-y-6">
    {canManage && <>
      <input ref={inputRef} type="file" accept="application/pdf,.pdf,image/jpeg,.jpg,.jpeg,image/png,.png,image/webp,.webp,image/gif,.gif" multiple className="hidden" onChange={(event) => event.target.files && startUpload(event.target.files)} />
      <button type="button" className={`flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-10 text-center transition-colors ${dragging ? "border-foreground bg-muted" : "border-border hover:bg-muted/50"}`} onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); void startUpload(event.dataTransfer.files) }}>
        <UploadCloud className="size-7 text-muted-foreground" />
        <span className="text-sm font-medium">{t("dropzone")}</span>
        <span className="text-xs text-muted-foreground">{t("dropzoneHint", { max: maxSizeLabel })}</span>
      </button>
      {uploads.length > 0 && <div className="space-y-2 rounded-2xl border border-border p-3">{uploads.map((item) => <div key={item.id} className="flex items-center gap-3 text-xs"><FileText className="size-4 text-muted-foreground" /><span className="min-w-0 flex-1 truncate">{item.name}</span>{item.status === "uploading" ? <span className="text-muted-foreground">{Math.round(item.progress)}%</span> : item.status === "done" ? <span className="text-muted-foreground">{t("uploadDone")}</span> : <span className="text-destructive">{item.error}</span>}</div>)}</div>}
    </>}
    {error && <p className="text-xs text-destructive">{error}</p>}
    {documents.length === 0 ? <div className="rounded-2xl border border-border p-10 text-center"><FileText className="mx-auto mb-3 size-7 text-muted-foreground" /><p className="text-sm font-medium">{t("emptyTitle")}</p><p className="mt-1 text-xs text-muted-foreground">{t("emptyDescription")}</p></div> : <div className="overflow-hidden rounded-2xl border border-border"><div className="hidden grid-cols-[1fr_120px_140px_80px] gap-4 border-b border-border bg-muted/40 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:grid"><span>{t("columns.document")}</span><span>{t("columns.size")}</span><span>{t("columns.uploadedBy")}</span><span /></div>{documents.map((document) => <div key={document.id} className="grid gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_120px_140px_80px] sm:items-center sm:gap-4"><Link href={`/documents/${document.id}`} className="flex min-w-0 items-center gap-3 hover:underline">{document.contentType.startsWith("image/") ? <ImageIcon className="size-4 shrink-0 text-muted-foreground" /> : <FileText className="size-4 shrink-0 text-muted-foreground" />}<div className="min-w-0"><p className="truncate text-sm font-medium">{document.originalName}</p><p className="text-xs text-muted-foreground">{format.dateTime(new Date(document.createdAt), { day: "2-digit", month: "2-digit", year: "numeric" })}</p></div></Link><span className="text-xs text-muted-foreground">{formatBytes(document.size, byteUnits)}</span><span className="text-xs text-muted-foreground">{document.uploadedBy}</span><div className="flex items-center justify-end gap-1"><Button asChild variant="ghost" size="icon-xs"><a href={`/api/documents/${document.id}/file`} target="_blank" rel="noreferrer" aria-label={t("open", { name: document.originalName })}><FileText /></a></Button><Button asChild variant="ghost" size="icon-xs"><a href={`/api/documents/${document.id}/file?download=1`} aria-label={t("download", { name: document.originalName })}><Download /></a></Button>{canManage && <Button variant="destructive" size="icon-xs" disabled={deleting === document.id} onClick={() => void removeDocument(document)} aria-label={t("delete", { name: document.originalName })}>{deleting === document.id ? <Loader2 className="animate-spin" /> : <Trash2 />}</Button>}</div></div>)}</div>}
  </div>
}
