"use client"

import { Check, Copy, Droplets, Link2, Loader2, Mail, Plus, Trash2, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type ShareLinkItem = {
  id: string
  token: string
  label: string | null
  createdAt: string
  expiresAt: string | null
  visitCount: number
  requireName: boolean
  requireEmail: boolean
  allowedEmails: string[]
  watermark: boolean
}

function parseEmailList(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[,\n]/)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    )
  )
}

// The origin (protocol+host) isn't known during SSR, and a client
// component's first render still runs pre-hydration in the browser, so
// reading window.location during render would make that first render
// disagree with the server-rendered HTML. Keep the displayed text to the
// deterministic relative path, and only resolve the full URL inside an
// event handler, which never runs during render.
function CopyButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      onClick={() => {
        void navigator.clipboard.writeText(window.location.origin + path)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      aria-label="Copier le lien"
    >
      {copied ? <Check /> : <Copy />}
    </Button>
  )
}

function Toggle({
  icon,
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  icon: React.ReactNode
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-xl border border-border p-3 transition-colors ${disabled ? "opacity-60" : "cursor-pointer hover:bg-white/5"}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-foreground"
      />
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-sm text-foreground">
          {icon}
          {title}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      </span>
    </label>
  )
}

export function ShareLinksClient({ createUrl, links }: { createUrl: string; links: ShareLinkItem[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState("")
  const [expiresInDays, setExpiresInDays] = useState("")
  const [requireName, setRequireName] = useState(true)
  const [requireEmail, setRequireEmail] = useState(true)
  const [allowedEmailsInput, setAllowedEmailsInput] = useState("")
  const [watermark, setWatermark] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const hasAllowedEmails = parseEmailList(allowedEmailsInput).length > 0

  async function createLink() {
    setSubmitting(true)
    setError(null)
    const response = await fetch(createUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        label: label || undefined,
        expiresInDays: expiresInDays ? Number(expiresInDays) : undefined,
        requireName,
        requireEmail,
        allowedEmails: parseEmailList(allowedEmailsInput),
        watermark,
      }),
    })
    setSubmitting(false)
    if (!response.ok) return setError("La création a échoué.")
    setOpen(false)
    setLabel("")
    setExpiresInDays("")
    setRequireName(true)
    setRequireEmail(true)
    setAllowedEmailsInput("")
    setWatermark(false)
    router.refresh()
  }

  async function revokeLink(id: string) {
    if (!window.confirm("Révoquer ce lien ? Il ne sera plus accessible.")) return
    setRevoking(id)
    const response = await fetch(`/api/share-links/${id}`, { method: "DELETE" })
    setRevoking(null)
    if (!response.ok) return setError("La révocation a échoué.")
    router.refresh()
  }

  return (
    <div className="rounded-2xl border border-border p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-foreground/80">
          <Link2 className="size-4" />
          <span>Liens de partage</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Plus />
          Nouveau lien
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nouveau lien de partage</SheetTitle>
            <SheetDescription>Choisissez ce qui est demandé au visiteur avant l&apos;accès.</SheetDescription>
          </SheetHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Nom du lien</label>
              <input
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Investisseurs, série A…"
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Expiration (jours)</label>
              <input
                type="number"
                min={1}
                value={expiresInDays}
                onChange={(event) => setExpiresInDays(event.target.value)}
                placeholder="Sans expiration"
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground/40"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Identification du visiteur</p>
              <Toggle
                icon={<User className="size-3.5" />}
                title="Demander le nom"
                description="Le visiteur doit saisir son nom avant d'ouvrir le document."
                checked={requireName}
                onChange={setRequireName}
              />
              <Toggle
                icon={<Mail className="size-3.5" />}
                title="Demander l'email"
                description={
                  hasAllowedEmails
                    ? "Activé automatiquement : une liste d'emails autorisés est renseignée ci-dessous."
                    : "Le visiteur doit saisir son email avant d'ouvrir le document."
                }
                checked={requireEmail || hasAllowedEmails}
                onChange={setRequireEmail}
                disabled={hasAllowedEmails}
              />
              <div className="space-y-1 rounded-xl border border-border p-3">
                <p className="text-sm text-foreground">Restreindre aux emails suivants</p>
                <p className="text-xs text-muted-foreground">
                  Un email par ligne (ou séparés par des virgules). Laissez vide pour n&apos;imposer aucune
                  restriction.
                </p>
                <textarea
                  value={allowedEmailsInput}
                  onChange={(event) => setAllowedEmailsInput(event.target.value)}
                  placeholder="alex@exemple.com&#10;sam@exemple.com"
                  rows={3}
                  className="mt-1 w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground/40"
                />
              </div>
              {!requireName && !requireEmail && (
                <p className="text-xs text-muted-foreground">
                  Aucune information demandée : le document s&apos;ouvre directement et les visites seront anonymes.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Protection</p>
              <Toggle
                icon={<Droplets className="size-3.5" />}
                title="Filigrane"
                description="Superpose l'identité du visiteur et la date sur le document."
                checked={watermark}
                onChange={setWatermark}
              />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <SheetFooter>
            <Button disabled={submitting} onClick={() => void createLink()}>
              {submitting ? <Loader2 className="animate-spin" /> : null}
              Créer le lien
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {error && !open && <p className="mb-2 text-xs text-destructive">{error}</p>}

      {links.length === 0 ? (
        <p className="text-xs text-muted-foreground">Aucun lien de partage actif.</p>
      ) : (
        <div className="space-y-2">
          {links.map((link) => {
            const path = `/view/${link.token}`
            const badges = [
              link.requireName && "nom",
              link.requireEmail && "email",
              link.allowedEmails.length > 0 &&
                `${link.allowedEmails.length} email${link.allowedEmails.length !== 1 ? "s" : ""} autorisé${link.allowedEmails.length !== 1 ? "s" : ""}`,
              link.watermark && "filigrane",
            ].filter(Boolean) as string[]
            return (
              <div key={link.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{link.label || "Lien sans nom"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {path} · {link.visitCount} visite{link.visitCount !== 1 ? "s" : ""}
                    {link.expiresAt && ` · expire le ${new Date(link.expiresAt).toLocaleDateString("fr-FR")}`}
                    {badges.length > 0 && ` · ${badges.join(", ")}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <CopyButton path={path} />
                  <Button
                    variant="destructive"
                    size="icon-xs"
                    disabled={revoking === link.id}
                    onClick={() => void revokeLink(link.id)}
                    aria-label="Révoquer"
                  >
                    {revoking === link.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
