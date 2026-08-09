import type { PlanId } from "@/lib/plan-limits"

export type BillingInterval = "month" | "year"
export type PaidPlanId = Exclude<PlanId, "free">

export const STRIPE_PRICE_IDS: Record<PaidPlanId, Record<BillingInterval, string | undefined>> = {
  pro: {
    month: process.env.STRIPE_PRICE_PRO_MONTHLY,
    year: process.env.STRIPE_PRICE_PRO_YEARLY,
  },
  business: {
    month: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
    year: process.env.STRIPE_PRICE_BUSINESS_YEARLY,
  },
}

export function priceIdFor(plan: PaidPlanId, interval: BillingInterval): string | null {
  return STRIPE_PRICE_IDS[plan][interval] || null
}

export function planFromPriceId(priceId: string): { plan: PaidPlanId; interval: BillingInterval } | null {
  for (const plan of Object.keys(STRIPE_PRICE_IDS) as PaidPlanId[]) {
    for (const interval of Object.keys(STRIPE_PRICE_IDS[plan]) as BillingInterval[]) {
      if (STRIPE_PRICE_IDS[plan][interval] === priceId) return { plan, interval }
    }
  }
  return null
}
