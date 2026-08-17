import { prisma } from "@/lib/prisma"

export type PlanId = "free" | "pro" | "business"

const INFINITE = Number.POSITIVE_INFINITY

// `api` gates programmatic access (API keys + /api/v1). Move it to pro here if
// you want the API available one tier lower — nothing else needs changing.
export const PLAN_LIMITS: Record<
  PlanId,
  { members: number; documents: number; datarooms: number; api: boolean }
> = {
  free: { members: 1, documents: 50, datarooms: 0, api: false },
  pro: { members: 5, documents: INFINITE, datarooms: INFINITE, api: false },
  business: { members: INFINITE, documents: INFINITE, datarooms: INFINITE, api: true },
}

export const PLAN_LABELS: Record<PlanId, string> = {
  free: "Free",
  pro: "Pro",
  business: "Business",
}

const ACTIVE_STATUSES = new Set(["active", "trialing"])

export function planFromSubscription(subscription: { plan: string; status: string } | null): PlanId {
  if (!subscription || !ACTIVE_STATUSES.has(subscription.status)) return "free"
  return subscription.plan === "pro" || subscription.plan === "business" ? subscription.plan : "free"
}

export async function getOrganizationLimits(organizationId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    select: { plan: true, status: true },
  })
  return PLAN_LIMITS[planFromSubscription(subscription)]
}
