"use client"

import { AlertCircle, Check, FolderLock, Loader2, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { PLAN_NAMES, PLAN_PRICES, TRIAL_DAYS, yearlySavings } from "@/lib/plan-catalog"
import type { BillingInterval, PaidPlanId } from "@/lib/stripe-plans"
import { cn } from "@/lib/utils"

const PLANS: PaidPlanId[] = ["pro", "business"]

// Pro is what actually unlocks datarooms, so it leads; Business sits next to
// it because someone hitting this wall is comparing, not just buying.
const RECOMMENDED: PaidPlanId = "pro"

function PlanCard({
  plan,
  interval,
  isOwner,
  loadingPlan,
  onSelect,
}: {
  plan: PaidPlanId
  interval: BillingInterval
  isOwner: boolean
  loadingPlan: PaidPlanId | null
  onSelect: (plan: PaidPlanId) => void
}) {
  const t = useTranslations("paywall")
  const tPlans = useTranslations("plans")
  const recommended = plan === RECOMMENDED
  // Feature lists live in the catalogue as arrays, one entry per bullet.
  const features = tPlans.raw(`features.${plan}`) as string[]

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border p-4 text-left",
        recommended ? "border-foreground/25 bg-white/[0.02]" : "border-border"
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{PLAN_NAMES[plan]}</p>
        {recommended && (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-foreground">{t("recommended")}</span>
        )}
      </div>

      <p className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold text-foreground">{PLAN_PRICES[plan][interval]}€</span>
        <span className="text-xs text-muted-foreground">{t("perMonth")}</span>
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {interval === "year" ? t("billedYearly") : t("billedMonthly")}
      </p>

      <ul className="mt-3 flex-1 space-y-1.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-xs text-muted-foreground">
            <Check className="mt-0.5 size-3.5 shrink-0 text-foreground/70" />
            {feature}
          </li>
        ))}
      </ul>

      {isOwner && (
        <Button
          className="mt-4 w-full"
          variant={recommended ? "default" : "outline"}
          onClick={() => onSelect(plan)}
          disabled={loadingPlan !== null}
        >
          {loadingPlan === plan ? <Loader2 className="animate-spin" /> : null}
          {t("upgradeTo", { plan: PLAN_NAMES[plan] })}
        </Button>
      )}
    </div>
  )
}

// Has no onOpenChange, so it can't be dismissed in place: the page behind it
// renders no dataroom data, and closing would only expose an empty shell. The
// corner button navigates away rather than closing.
export function DataroomsPaywall({ isOwner }: { isOwner: boolean }) {
  const t = useTranslations("paywall")
  const [interval, setInterval] = useState<BillingInterval>("year")
  const [loadingPlan, setLoadingPlan] = useState<PaidPlanId | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function startCheckout(plan: PaidPlanId) {
    setError(null)
    setLoadingPlan(plan)
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      })
      const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string }
      if (!response.ok || !data.url) {
        setLoadingPlan(null)
        setError(data.error || t("checkoutFailed"))
        return
      }
      window.location.assign(data.url)
    } catch {
      setLoadingPlan(null)
      setError(t("checkoutFailed"))
    }
  }

  return (
    <AlertDialog open>
      <AlertDialogContent className="max-h-[90svh] max-w-2xl overflow-y-auto">
        <Link
          href="/"
          aria-label={t("close")}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          <X className="size-4" />
        </Link>

        <AlertDialogHeader>
          <FolderLock className="mb-1 size-7 text-muted-foreground" />
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("description")}</AlertDialogDescription>
        </AlertDialogHeader>

        {isOwner && (
          <div className="mt-5 flex justify-center">
            <div className="inline-flex rounded-lg border border-border p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setInterval("month")}
                className={cn(
                  "rounded-md px-3 py-1.5 transition-colors",
                  interval === "month" ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t("monthly")}
              </button>
              <button
                type="button"
                onClick={() => setInterval("year")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors",
                  interval === "year" ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t("yearly")}
                <span className="text-[10px] text-emerald-500">
                  {t("savings", { percent: yearlySavings(RECOMMENDED) })}
                </span>
              </button>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan}
              plan={plan}
              interval={interval}
              isOwner={isOwner}
              loadingPlan={loadingPlan}
              onSelect={(selected) => void startCheckout(selected)}
            />
          ))}
        </div>

        <AlertDialogFooter>
          <p className="text-xs text-muted-foreground">
            {isOwner ? t("trial", { days: TRIAL_DAYS }) : t("askOwner")}
          </p>
          {isOwner && (
            <Link href="/settings/billing" className="text-xs text-muted-foreground hover:text-foreground">
              {t("seeBilling")}
            </Link>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
