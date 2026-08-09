"use client"

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { BillingInterval, PaidPlanId } from "@/lib/stripe-plans"
import type { PlanId } from "@/lib/plan-limits"

const PLAN_PRICES: Record<PaidPlanId, Record<BillingInterval, number>> = {
  pro: { month: 29, year: 24 },
  business: { month: 79, year: 59 },
}

const PLAN_NAMES: Record<PlanId, string> = { free: "Free", pro: "Pro", business: "Business" }

function formatUsage(count: number, limit: number) {
  return `${count} / ${Number.isFinite(limit) ? limit : "illimité"}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
}

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
  const [interval, setInterval] = useState<BillingInterval>("year")
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
      setError(data.error || "Impossible de démarrer le paiement.")
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
      setError(data.error || "Impossible d'ouvrir la facturation.")
      return
    }
    window.location.assign(data.url)
  }

  const statusLabel = (() => {
    if (plan === "free") return null
    if (cancelAtPeriodEnd && currentPeriodEnd) return `Annulé, actif jusqu'au ${formatDate(currentPeriodEnd)}`
    if (status === "trialing" && currentPeriodEnd) return `Essai gratuit jusqu'au ${formatDate(currentPeriodEnd)}`
    if (status === "past_due") return "Paiement échoué, mise à jour de la carte requise"
    if (currentPeriodEnd) return `Renouvellement le ${formatDate(currentPeriodEnd)}`
    return null
  })()

  return (
    <div className="rounded-2xl border border-border p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium text-foreground">Facturation</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Plan {PLAN_NAMES[plan]}
            {statusLabel ? ` · ${statusLabel}` : ""}
          </p>
        </div>
        {hasStripeCustomer && isOwner && (
          <Button variant="outline" size="sm" onClick={() => void openPortal()} disabled={loadingAction !== null}>
            {loadingAction === "portal" ? <Loader2 className="animate-spin" /> : null}
            Gérer la facturation
          </Button>
        )}
      </div>

      {checkoutResult === "success" && (
        <Alert className="mb-4">
          <CheckCircle2 />
          <AlertDescription>Abonnement activé.</AlertDescription>
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
          <p className="text-[11px] text-muted-foreground">Membres</p>
          <p className="text-sm font-medium text-foreground">{formatUsage(usage.members, limits.members)}</p>
        </div>
        <div className="rounded-lg border border-border px-3 py-2">
          <p className="text-[11px] text-muted-foreground">Documents</p>
          <p className="text-sm font-medium text-foreground">{formatUsage(usage.documents, limits.documents)}</p>
        </div>
        <div className="rounded-lg border border-border px-3 py-2">
          <p className="text-[11px] text-muted-foreground">Datarooms</p>
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
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setInterval("year")}
              className={`rounded-md px-2.5 py-1 transition-colors ${interval === "year" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
            >
              Annuel
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {(["pro", "business"] as const)
              .filter((candidate) => candidate !== plan)
              .map((candidate) => (
                <div key={candidate} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{PLAN_NAMES[candidate]}</p>
                    <p className="text-xs text-muted-foreground">{PLAN_PRICES[candidate][interval]}€/mois</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => void startCheckout(candidate)}
                    disabled={loadingAction !== null}
                  >
                    {loadingAction === `checkout:${candidate}` ? <Loader2 className="animate-spin" /> : null}
                    Passer à {PLAN_NAMES[candidate]}
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}

      {!isOwner && plan === "free" && (
        <p className="text-xs text-muted-foreground">Seul le propriétaire de l&apos;organisation peut changer de plan.</p>
      )}
    </div>
  )
}
