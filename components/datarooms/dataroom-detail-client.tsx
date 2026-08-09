"use client"

import { Download, FileText, ImageIcon, Loader2, Plus, Trash2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"

type DocumentItem = { id: string; originalName: string; contentType: string; size: number; createdAt: string; uploadedBy: string }

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

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
    if (!response.ok) return setError("L'ajout a échoué.")
    router.refresh()
  }

  async function removeDocument(documentId: string) {
    setPendingId(documentId)
    setError(null)
    const response = await fetch(`/api/datarooms/${dataroomId}/documents/${documentId}`, { method: "DELETE" })
    setPendingId(null)
    if (!response.ok) return setError("Le retrait a échoué.")
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setPicking((v) => !v)}>
            {picking ? <X /> : <Plus />}
            {picking ? "Fermer" : "Ajouter des documents"}
          </Button>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {picking && (
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="border-b border-border bg-muted/40 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Documents disponibles
          </div>
          {availableDocuments.length === 0 ? (
            <p className="p-4 text-xs text-muted-foreground">
              Tous les documents de votre espace sont déjà dans cette dataroom.
            </p>
          ) : (
            availableDocuments.map((document) => (
              <div key={document.id} className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0">
                <div className="flex min-w-0 items-center gap-3">
                  <DocIcon contentType={document.contentType} />
                  <span className="truncate text-sm">{document.originalName}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatSize(document.size)}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={pendingId === document.id}
                  onClick={() => void addDocument(document.id)}
                  aria-label={`Ajouter ${document.originalName}`}
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
          <p className="text-sm font-medium">Aucun document dans cette dataroom</p>
          <p className="mt-1 text-xs text-muted-foreground">Ajoutez des documents depuis votre bibliothèque.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="hidden grid-cols-[1fr_120px_140px_80px] gap-4 border-b border-border bg-muted/40 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:grid">
            <span>Document</span>
            <span>Taille</span>
            <span>Ajouté par</span>
            <span />
          </div>
          {documents.map((document) => (
            <div key={document.id} className="grid gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_120px_140px_80px] sm:items-center sm:gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <DocIcon contentType={document.contentType} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{document.originalName}</p>
                  <p className="text-xs text-muted-foreground">{new Date(document.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{formatSize(document.size)}</span>
              <span className="text-xs text-muted-foreground">{document.uploadedBy}</span>
              <div className="flex items-center justify-end gap-1">
                <Button asChild variant="ghost" size="icon-xs">
                  <a href={`/api/documents/${document.id}/file`} target="_blank" rel="noreferrer" aria-label={`Ouvrir ${document.originalName}`}>
                    <FileText />
                  </a>
                </Button>
                <Button asChild variant="ghost" size="icon-xs">
                  <a href={`/api/documents/${document.id}/file?download=1`} aria-label={`Télécharger ${document.originalName}`}>
                    <Download />
                  </a>
                </Button>
                {canManage && (
                  <Button
                    variant="destructive"
                    size="icon-xs"
                    disabled={pendingId === document.id}
                    onClick={() => void removeDocument(document.id)}
                    aria-label={`Retirer ${document.originalName}`}
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
