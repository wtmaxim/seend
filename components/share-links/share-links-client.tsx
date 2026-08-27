"use client"

import { Check, Copy, Droplets, Link2, Loader2, Mail, Plus, Trash2, User } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
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
import { useRouter } from "@/i18n/navigation"

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
  const t = useTranslations("shareLinks")
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
      aria-label={t("copyLink")}
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
  const t = useTranslations("shareLinks")
  const tCommon = useTranslations("common")
  const format = useFormatter()
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
    if (!response.ok) return setError(t("createFailed"))
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
    if (!window.confirm(t("revokeConfirm"))) return
    setRevoking(id)
    const response = await fetch(`/api/share-links/${id}`, { method: "DELETE" })
    setRevoking(null)
    if (!response.ok) return setError(t("revokeFailed"))
    router.refresh()
  }

  return (
    <div className="rounded-2xl border border-border p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-foreground/80">
          <Link2 className="size-4" />
          <span>{t("title")}</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Plus />
          {t("newLink")}
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t("sheetTitle")}</SheetTitle>
            <SheetDescription>{t("sheetDescription")}</SheetDescription>
          </SheetHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">{t("labelField")}</label>
              <input
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder={t("labelPlaceholder")}
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">{t("expiryField")}</label>
              <input
                type="number"
                min={1}
                value={expiresInDays}
                onChange={(event) => setExpiresInDays(event.target.value)}
                placeholder={t("expiryPlaceholder")}
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground/40"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{t("visitorIdentification")}</p>
              <Toggle
                icon={<User className="size-3.5" />}
                title={t("askName")}
                description={t("askNameDescription")}
                checked={requireName}
                onChange={setRequireName}
              />
              <Toggle
                icon={<Mail className="size-3.5" />}
                title={t("askEmail")}
                description={hasAllowedEmails ? t("askEmailForced") : t("askEmailDescription")}
                checked={requireEmail || hasAllowedEmails}
                onChange={setRequireEmail}
                disabled={hasAllowedEmails}
              />
              <div className="space-y-1 rounded-xl border border-border p-3">
                <p className="text-sm text-foreground">{t("restrictTitle")}</p>
                <p className="text-xs text-muted-foreground">{t("restrictDescription")}</p>
                <textarea
                  value={allowedEmailsInput}
                  onChange={(event) => setAllowedEmailsInput(event.target.value)}
                  placeholder="alex@exemple.com&#10;sam@exemple.com"
                  rows={3}
                  className="mt-1 w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground/40"
                />
              </div>
              {!requireName && !requireEmail && (
                <p className="text-xs text-muted-foreground">{t("anonymousNotice")}</p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{t("protection")}</p>
              <Toggle
                icon={<Droplets className="size-3.5" />}
                title={t("watermark")}
                description={t("watermarkDescription")}
                checked={watermark}
                onChange={setWatermark}
              />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <SheetFooter>
            <Button disabled={submitting} onClick={() => void createLink()}>
              {submitting ? <Loader2 className="animate-spin" /> : null}
              {t("createLink")}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {tCommon("cancel")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {error && !open && <p className="mb-2 text-xs text-destructive">{error}</p>}

      {links.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="space-y-2">
          {links.map((link) => {
            const path = `/view/${link.token}`
            const badges = [
              link.requireName && t("badges.name"),
              link.requireEmail && t("badges.email"),
              link.allowedEmails.length > 0 && t("badges.allowedEmails", { count: link.allowedEmails.length }),
              link.watermark && t("badges.watermark"),
            ].filter(Boolean) as string[]
            return (
              <div key={link.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{link.label || t("untitled")}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {path} · {t("visitCount", { count: link.visitCount })}
                    {link.expiresAt && t("expiresOn", { date: format.dateTime(new Date(link.expiresAt), { day: "2-digit", month: "2-digit", year: "numeric" }) })}
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
                    aria-label={t("revoke")}
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
