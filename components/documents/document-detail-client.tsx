"use client"

import { Download, FileText, FolderOpen, ImageIcon, Loader2, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"

type DocumentDetail = {
  id: string
  originalName: string
  contentType: string
  size: number
  createdAt: string
  uploadedBy: string
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isImage = document.contentType.startsWith("image/")

  async function removeDocument() {
    if (!window.confirm(`Supprimer « ${document.originalName} » définitivement ?`)) return
    setDeleting(true)
    const response = await fetch(`/api/documents/${document.id}`, { method: "DELETE" })
    if (!response.ok) {
      setError("La suppression a échoué.")
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
            <p className="text-sm text-muted-foreground">Aperçu non disponible pour ce type de fichier.</p>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        {[
          { label: "Type", value: isImage ? "Image" : "PDF" },
          { label: "Taille", value: formatSize(document.size) },
          { label: "Ajouté par", value: document.uploadedBy },
          { label: "Ajouté le", value: new Date(document.createdAt).toLocaleDateString("fr-FR") },
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
            Ouvrir
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={`/api/documents/${document.id}/file?download=1`}>
            <Download />
            Télécharger
          </a>
        </Button>
        {canManage && (
          <Button variant="destructive" disabled={deleting} onClick={() => void removeDocument()}>
            {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
            Supprimer
          </Button>
        )}
      </div>

      <div className="rounded-2xl border border-border p-5">
        <div className="mb-3 flex items-center gap-2 text-sm text-foreground/80">
          <FolderOpen className="size-4" />
          <span>Datarooms</span>
        </div>
        {datarooms.length === 0 ? (
          <p className="text-xs text-muted-foreground">Ce document n&apos;est dans aucune dataroom.</p>
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
