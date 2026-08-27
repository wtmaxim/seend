import type { PlanId } from "@/lib/plan-limits"
import type { BillingInterval, PaidPlanId } from "@/lib/stripe-plans"

/**
 * How the plans are presented to the user: names, prices and what each one
 * unlocks. Kept apart from `plan-limits` (which enforces the limits and hits
 * the database) and from `stripe-plans` (which maps to Stripe price ids), so
 * client components can import it without pulling either into the bundle.
 *
 * The prices here are display only — Stripe remains the source of truth for
 * what is actually charged. Keep them in step with the Stripe price ids.
 */

export const PLAN_NAMES: Record<PlanId, string> = { free: "Free", pro: "Pro", business: "Business" }

/** Monthly price in euros. `year` is the per-month equivalent when billed annually. */
export const PLAN_PRICES: Record<PaidPlanId, Record<BillingInterval, number>> = {
  pro: { month: 29, year: 24 },
  business: { month: 79, year: 59 },
}

// What each paid plan adds is translated copy, so it lives in the message
// catalogues under `plans.features`, not here.

/** Granted by Stripe on a first subscription — see app/api/billing/checkout. */
export const TRIAL_DAYS = 14

/** Percentage saved by paying yearly, for the "économisez X%" badge. */
export function yearlySavings(plan: PaidPlanId) {
  const { month, year } = PLAN_PRICES[plan]
  return Math.round((1 - year / month) * 100)
}
