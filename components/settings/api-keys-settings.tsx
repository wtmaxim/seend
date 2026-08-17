"use client"

import { AlertCircle, Check, Copy, KeyRound, Loader2, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ApiKeyItem = {
  id: string
  name: string
  hint: string
  createdAt: string
  lastUsedAt: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
}

export function ApiKeysSettings({ apiKeys, canManage }: { apiKeys: ApiKeyItem[]; canManage: boolean }) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [freshKey, setFreshKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function createKey() {
    const trimmed = name.trim()
    if (!trimmed) return setError("Le nom est requis.")

    setSubmitting(true)
    setError(null)
    const response = await fetch("/api/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    })
    setSubmitting(false)

    const data = await response.json().catch(() => null)
    if (!response.ok) return setError((data as { error?: string } | null)?.error || "La création a échoué.")

    setFreshKey((data as { key: string }).key)
    setName("")
    setCreating(false)
    router.refresh()
  }

  async function revokeKey(apiKey: ApiKeyItem) {
    if (!window.confirm(`Révoquer la clé « ${apiKey.name} » ? Les intégrations qui l'utilisent cesseront de fonctionner.`)) {
      return
    }
    setRevoking(apiKey.id)
    setError(null)
    const response = await fetch(`/api/api-keys/${apiKey.id}`, { method: "DELETE" })
    setRevoking(null)
    if (!response.ok) return setError("La révocation a échoué.")
    router.refresh()
  }

  function copyKey() {
    if (!freshKey) return
    void navigator.clipboard.writeText(freshKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium text-foreground">Clés API</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Automatise l&apos;upload de documents, la création de datarooms et de liens de partage.
            </p>
          </div>
          {canManage && !creating && (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus />
              Nouvelle clé
            </Button>
          )}
        </div>

        {freshKey && (
          <div className="mb-4 rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-xs font-medium text-foreground">Copie cette clé maintenant</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Elle ne sera plus jamais affichée. Si tu la perds, révoque-la et crées-en une nouvelle.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs">
                {freshKey}
              </code>
              <Button variant="outline" size="sm" onClick={copyKey}>
                {copied ? <Check /> : <Copy />}
                {copied ? "Copié" : "Copier"}
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => setFreshKey(null)}>
              J&apos;ai copié la clé
            </Button>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {creating && (
          <div className="mb-4 space-y-3 rounded-xl border border-border p-4">
            <div className="space-y-1.5">
              <Label htmlFor="api-key-name">Nom de la clé</Label>
              <Input
                id="api-key-name"
                autoFocus
                placeholder="Intégration CRM"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => void createKey()} disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" /> : null}
                Créer la clé
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setCreating(false)
                  setError(null)
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

        {apiKeys.length === 0 ? (
          <div className="rounded-xl border border-border p-8 text-center">
            <KeyRound className="mx-auto mb-3 size-6 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Aucune clé API</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Crée une clé pour piloter Seend depuis tes propres outils.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            {apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{apiKey.name}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {apiKey.hint}…
                    <span className="ml-2 font-sans">
                      créée le {formatDate(apiKey.createdAt)}
                      {apiKey.lastUsedAt
                        ? ` · dernière utilisation le ${formatDate(apiKey.lastUsedAt)}`
                        : " · jamais utilisée"}
                    </span>
                  </p>
                </div>
                {canManage && (
                  <Button
                    variant="destructive"
                    size="icon-xs"
                    disabled={revoking === apiKey.id}
                    onClick={() => void revokeKey(apiKey)}
                    aria-label={`Révoquer ${apiKey.name}`}
                  >
                    {revoking === apiKey.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border p-5">
        <h2 className="text-sm font-medium text-foreground">Utilisation</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Authentifie chaque requête avec l&apos;en-tête <code className="font-mono">Authorization: Bearer</code>.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs text-muted-foreground">
{`curl https://seend.co/api/v1/documents \\
  -H "Authorization: Bearer seend_..."`}
        </pre>
      </div>
    </div>
  )
}
