"use client"

import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useRef, useState } from "react"

import { useRouter } from "@/i18n/navigation"

export function VisitGate({
  token,
  title,
  kind,
  requireName,
  requireEmail,
}: {
  token: string
  title: string
  kind: "document" | "dataroom"
  requireName: boolean
  requireEmail: boolean
}) {
  const t = useTranslations("view")
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const asksNothing = !requireName && !requireEmail

  const submit = useCallback(
    async (payload: { name?: string; email?: string }) => {
      setSubmitting(true)
      setError(null)
      const response = await fetch(`/api/view/${token}/visit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        setError(data?.error || t("genericError"))
        setSubmitting(false)
        return
      }
      router.refresh()
    },
    [token, router, t]
  )

  // Nothing to ask for: open the visit straight away so the visitor never
  // sees a form. Guarded against the effect running twice (React strict
  // mode) creating two visits for one arrival.
  const autoOpenedRef = useRef(false)
  useEffect(() => {
    if (!asksNothing || autoOpenedRef.current) return
    autoOpenedRef.current = true
    void submit({})
  }, [asksNothing, submit])

  if (asksNothing) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {kind === "dataroom" ? t("sharedDataroom") : t("sharedDocument")}
          </p>
          <h1 className="text-xl font-medium tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{t("gatePrompt")}</p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void submit({ name: requireName ? name : undefined, email: requireEmail ? email : undefined })
          }}
          className="space-y-3"
        >
          {requireName && (
            <input
              required
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("namePlaceholder")}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground/40"
            />
          )}
          {requireEmail && (
            <input
              required
              type="email"
              autoFocus={!requireName}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("emailPlaceholder")}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground/40"
            />
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {t("continue")}
          </button>
        </form>
      </div>
    </div>
  )
}
