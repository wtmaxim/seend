"use client"

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { PLAN_NAMES, PLAN_PRICES } from "@/lib/plan-catalog"
import type { BillingInterval, PaidPlanId } from "@/lib/stripe-plans"
import type { PlanId } from "@/lib/plan-limits"

export function BillingSettings({
  isOwner,
  plan,
  status,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  hasStripeCustomer,
  usage,
  limits,
  checkoutResult,
}: {
  isOwner: boolean
  plan: PlanId
  status: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  hasStripeCustomer: boolean
  usage: { members: number; documents: number; datarooms: number }
  limits: { members: number; documents: number; datarooms: number }
  checkoutResult: "success" | "canceled" | null
}) {
  const t = useTranslations("billing")
  const format = useFormatter()
  const [interval, setInterval] = useState<BillingInterval>("year")
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function formatUsage(count: number, limit: number) {
    return `${count} / ${Number.isFinite(limit) ? limit : t("unlimited")}`
  }

  function formatDate(iso: string) {
    return format.dateTime(new Date(iso), { day: "numeric", month: "long", year: "numeric" })
  }

  async function startCheckout(targetPlan: PaidPlanId) {
    setError(null)
    setLoadingAction(`checkout:${targetPlan}`)
    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: targetPlan, interval }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || !data.url) {
      setLoadingAction(null)
      setError(data.error || t("checkoutFailed"))
      return
    }
    window.location.assign(data.url)
  }

  async function openPortal() {
    setError(null)
    setLoadingAction("portal")
    const response = await fetch("/api/billing/portal", { method: "POST" })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || !data.url) {
      setLoadingAction(null)
      setError(data.error || t("portalFailed"))
      return
    }
    window.location.assign(data.url)
  }

  const statusLabel = (() => {
    if (plan === "free") return null
    if (cancelAtPeriodEnd && currentPeriodEnd) return t("canceledUntil", { date: formatDate(currentPeriodEnd) })
    if (status === "trialing" && currentPeriodEnd) return t("trialUntil", { date: formatDate(currentPeriodEnd) })
    if (status === "past_due") return t("pastDue")
    if (currentPeriodEnd) return t("renewsOn", { date: formatDate(currentPeriodEnd) })
    return null
  })()

  return (
    <div className="rounded-2xl border border-border p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium text-foreground">{t("title")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("planLine", { plan: PLAN_NAMES[plan] })}
            {statusLabel ? ` · ${statusLabel}` : ""}
          </p>
        </div>
        {hasStripeCustomer && isOwner && (
          <Button variant="outline" size="sm" onClick={() => void openPortal()} disabled={loadingAction !== null}>
            {loadingAction === "portal" ? <Loader2 className="animate-spin" /> : null}
            {t("manage")}
          </Button>
        )}
      </div>

      {checkoutResult === "success" && (
        <Alert className="mb-4">
          <CheckCircle2 />
          <AlertDescription>{t("activated")}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mb-5 grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-border px-3 py-2">
          <p className="text-[11px] text-muted-foreground">{t("usage.members")}</p>
          <p className="text-sm font-medium text-foreground">{formatUsage(usage.members, limits.members)}</p>
        </div>
        <div className="rounded-lg border border-border px-3 py-2">
          <p className="text-[11px] text-muted-foreground">{t("usage.documents")}</p>
          <p className="text-sm font-medium text-foreground">{formatUsage(usage.documents, limits.documents)}</p>
        </div>
        <div className="rounded-lg border border-border px-3 py-2">
          <p className="text-[11px] text-muted-foreground">{t("usage.datarooms")}</p>
          <p className="text-sm font-medium text-foreground">{formatUsage(usage.datarooms, limits.datarooms)}</p>
        </div>
      </div>

      {isOwner && plan !== "business" && (
        <div>
          <div className="mb-3 inline-flex rounded-lg border border-border p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setInterval("month")}
              className={`rounded-md px-2.5 py-1 transition-colors ${interval === "month" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
            >
              {t("monthly")}
            </button>
            <button
              type="button"
              onClick={() => setInterval("year")}
              className={`rounded-md px-2.5 py-1 transition-colors ${interval === "year" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
            >
              {t("yearly")}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {(["pro", "business"] as const)
              .filter((candidate) => candidate !== plan)
              .map((candidate) => (
                <div key={candidate} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{PLAN_NAMES[candidate]}</p>
                    <p className="text-xs text-muted-foreground">{t("perMonth", { price: PLAN_PRICES[candidate][interval] })}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => void startCheckout(candidate)}
                    disabled={loadingAction !== null}
                  >
                    {loadingAction === `checkout:${candidate}` ? <Loader2 className="animate-spin" /> : null}
                    {t("upgradeTo", { plan: PLAN_NAMES[candidate] })}
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}

      {!isOwner && plan === "free" && (
        <p className="text-xs text-muted-foreground">{t("ownerOnly")}</p>
      )}
    </div>
  )
}
