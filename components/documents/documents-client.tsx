"use client"

import { upload } from "@vercel/blob/client"
import { Download, FileText, ImageIcon, Loader2, Trash2, UploadCloud } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { DOCUMENT_CONTENT_TYPES, DOCUMENT_EXTENSIONS, MAX_DOCUMENT_SIZE, MAX_DOCUMENTS_PER_BATCH } from "@/lib/document-constants"
import type { DocumentContentType } from "@/lib/document-constants"

type DocumentItem = { id: string; originalName: string; contentType: string; size: number; createdAt: string; uploadedBy: string }
type UploadItem = { id: string; name: string; progress: number; status: "uploading" | "done" | "error"; error?: string }

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentsClient({ documents, canManage, organizationId }: { documents: DocumentItem[]; canManage: boolean; organizationId: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [dragging, setDragging] = useState(false)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function startUpload(files: FileList | File[]) {
    const selected = Array.from(files)
    setError(null)
    if (selected.length > MAX_DOCUMENTS_PER_BATCH) return setError(`Vous pouvez envoyer ${MAX_DOCUMENTS_PER_BATCH} fichiers à la fois.`)
    const invalid = selected.find((file) => !DOCUMENT_CONTENT_TYPES.includes(file.type as DocumentContentType) || file.size <= 0 || file.size > MAX_DOCUMENT_SIZE)
    if (invalid) return setError(`${invalid.name} doit être un PDF ou une image (JPG, PNG, WebP, GIF) de 50 Mo maximum.`)
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
        if (!completion.ok) throw new Error("Finalisation impossible")
        setUploads((current) => current.map((entry) => entry.id === item.id ? { ...entry, progress: 100, status: "done" } : entry))
      } catch (uploadError) {
        setUploads((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: "error", error: uploadError instanceof Error ? uploadError.message : "Échec" } : entry))
      }
    }))
    router.refresh()
  }

  async function removeDocument(document: DocumentItem) {
    if (!window.confirm(`Supprimer « ${document.originalName} » définitivement ?`)) return
    setDeleting(document.id)
    const response = await fetch(`/api/documents/${document.id}`, { method: "DELETE" })
    if (!response.ok) setError("La suppression a échoué.")
    setDeleting(null)
    router.refresh()
  }

  return <div className="space-y-6">
    {canManage && <>
      <input ref={inputRef} type="file" accept="application/pdf,.pdf,image/jpeg,.jpg,.jpeg,image/png,.png,image/webp,.webp,image/gif,.gif" multiple className="hidden" onChange={(event) => event.target.files && startUpload(event.target.files)} />
      <button type="button" className={`flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-10 text-center transition-colors ${dragging ? "border-foreground bg-muted" : "border-border hover:bg-muted/50"}`} onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); void startUpload(event.dataTransfer.files) }}>
        <UploadCloud className="size-7 text-muted-foreground" />
        <span className="text-sm font-medium">Déposez vos fichiers ici ou cliquez pour parcourir</span>
        <span className="text-xs text-muted-foreground">PDF ou image (JPG, PNG, WebP, GIF) · 50 Mo maximum par fichier</span>
      </button>
      {uploads.length > 0 && <div className="space-y-2 rounded-2xl border border-border p-3">{uploads.map((item) => <div key={item.id} className="flex items-center gap-3 text-xs"><FileText className="size-4 text-muted-foreground" /><span className="min-w-0 flex-1 truncate">{item.name}</span>{item.status === "uploading" ? <span className="text-muted-foreground">{Math.round(item.progress)}%</span> : item.status === "done" ? <span className="text-muted-foreground">Terminé</span> : <span className="text-destructive">{item.error}</span>}</div>)}</div>}
    </>}
    {error && <p className="text-xs text-destructive">{error}</p>}
    {documents.length === 0 ? <div className="rounded-2xl border border-border p-10 text-center"><FileText className="mx-auto mb-3 size-7 text-muted-foreground" /><p className="text-sm font-medium">Aucun document pour le moment</p><p className="mt-1 text-xs text-muted-foreground">Les fichiers de votre espace apparaîtront ici.</p></div> : <div className="overflow-hidden rounded-2xl border border-border"><div className="hidden grid-cols-[1fr_120px_140px_80px] gap-4 border-b border-border bg-muted/40 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:grid"><span>Document</span><span>Taille</span><span>Ajouté par</span><span /></div>{documents.map((document) => <div key={document.id} className="grid gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_120px_140px_80px] sm:items-center sm:gap-4"><Link href={`/documents/${document.id}`} className="flex min-w-0 items-center gap-3 hover:underline">{document.contentType.startsWith("image/") ? <ImageIcon className="size-4 shrink-0 text-muted-foreground" /> : <FileText className="size-4 shrink-0 text-muted-foreground" />}<div className="min-w-0"><p className="truncate text-sm font-medium">{document.originalName}</p><p className="text-xs text-muted-foreground">{new Date(document.createdAt).toLocaleDateString("fr-FR")}</p></div></Link><span className="text-xs text-muted-foreground">{formatSize(document.size)}</span><span className="text-xs text-muted-foreground">{document.uploadedBy}</span><div className="flex items-center justify-end gap-1"><Button asChild variant="ghost" size="icon-xs"><a href={`/api/documents/${document.id}/file`} target="_blank" rel="noreferrer" aria-label={`Ouvrir ${document.originalName}`}><FileText /></a></Button><Button asChild variant="ghost" size="icon-xs"><a href={`/api/documents/${document.id}/file?download=1`} aria-label={`Télécharger ${document.originalName}`}><Download /></a></Button>{canManage && <Button variant="destructive" size="icon-xs" disabled={deleting === document.id} onClick={() => void removeDocument(document)} aria-label={`Supprimer ${document.originalName}`}>{deleting === document.id ? <Loader2 className="animate-spin" /> : <Trash2 />}</Button>}</div></div>)}</div>}
  </div>
}
