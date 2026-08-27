"use client"

import { FolderOpen, Loader2, Plus, Trash2 } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Link, useRouter } from "@/i18n/navigation"

type DataroomItem = { id: string; name: string; description: string | null; documentCount: number; createdAt: string }

export function DataroomsClient({ datarooms, canManage }: { datarooms: DataroomItem[]; canManage: boolean }) {
  const t = useTranslations("datarooms")
  const tCommon = useTranslations("common")
  const format = useFormatter()
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function createDataroom() {
    if (!name.trim()) return setError(tCommon("nameRequired"))
    setSubmitting(true)
    setError(null)
    const response = await fetch("/api/datarooms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, description }),
    })
    setSubmitting(false)
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      return setError((data as { error?: string } | null)?.error || tCommon("createFailed"))
    }
    const { id } = (await response.json()) as { id: string }
    router.push(`/datarooms/${id}`)
  }

  async function removeDataroom(dataroom: DataroomItem) {
    if (!window.confirm(t("deleteConfirm", { name: dataroom.name }))) return
    setDeleting(dataroom.id)
    const response = await fetch(`/api/datarooms/${dataroom.id}`, { method: "DELETE" })
    if (!response.ok) setError(t("deleteFailed"))
    setDeleting(null)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="rounded-2xl border border-border p-5">
          {creating ? (
            <div className="space-y-3">
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t("namePlaceholder")}
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground/40"
              />
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t("descriptionPlaceholder")}
                rows={2}
                className="w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground/40"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex items-center gap-2">
                <Button onClick={() => void createDataroom()} disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin" /> : null}
                  {t("create")}
                </Button>
                <Button variant="ghost" onClick={() => { setCreating(false); setError(null) }}>
                  {tCommon("cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Plus className="size-4" />
              {t("newDataroom")}
            </button>
          )}
        </div>
      )}

      {!creating && error && <p className="text-xs text-destructive">{error}</p>}

      {datarooms.length === 0 ? (
        <div className="rounded-2xl border border-border p-10 text-center">
          <FolderOpen className="mx-auto mb-3 size-7 text-muted-foreground" />
          <p className="text-sm font-medium">{t("emptyTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("emptyDescription")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {datarooms.map((dataroom) => (
            <div key={dataroom.id} className="group relative rounded-2xl border border-border p-5">
              <Link href={`/datarooms/${dataroom.id}`} className="block space-y-3">
                <div className="flex items-center gap-2 text-sm text-foreground/80">
                  <FolderOpen className="size-4" />
                  <span className="truncate font-medium text-foreground">{dataroom.name}</span>
                </div>
                {dataroom.description && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">{dataroom.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {t("documentCount", { count: dataroom.documentCount })} ·{" "}
                  {format.dateTime(new Date(dataroom.createdAt), { day: "2-digit", month: "2-digit", year: "numeric" })}
                </p>
              </Link>
              {canManage && (
                <Button
                  variant="destructive"
                  size="icon-xs"
                  disabled={deleting === dataroom.id}
                  onClick={() => void removeDataroom(dataroom)}
                  aria-label={t("delete", { name: dataroom.name })}
                  className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  {deleting === dataroom.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
