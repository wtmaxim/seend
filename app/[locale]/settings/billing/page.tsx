import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { redirect } from "next/navigation"

import { BillingSettings } from "@/components/settings/billing-settings"
import { getDocumentAccess } from "@/lib/document-access"
import { PLAN_LIMITS, planFromSubscription } from "@/lib/plan-limits"
import { prisma } from "@/lib/prisma"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta.billing")
  return { title: t("title"), description: t("description") }
}

export default async function SettingsBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const access = await getDocumentAccess()
  if (!access?.session?.user) redirect("/login")
  if (!access.membership || !access.organization) redirect("/register")

  const { checkout } = await searchParams
  const checkoutResult = checkout === "success" || checkout === "canceled" ? checkout : null

  const [documentCount, memberCount, dataroomCount, subscription] = await Promise.all([
    prisma.document.count({ where: { organizationId: access.membership.organizationId } }),
    prisma.member.count({ where: { organizationId: access.membership.organizationId } }),
    prisma.dataroom.count({ where: { organizationId: access.membership.organizationId } }),
    prisma.subscription.findUnique({ where: { organizationId: access.membership.organizationId } }),
  ])

  const plan = planFromSubscription(subscription)
  const limits = PLAN_LIMITS[plan]

  return (
    <BillingSettings
      isOwner={access.membership.role === "owner"}
      plan={plan}
      status={subscription?.status ?? null}
      currentPeriodEnd={subscription?.currentPeriodEnd.toISOString() ?? null}
      cancelAtPeriodEnd={subscription?.cancelAtPeriodEnd ?? false}
      hasStripeCustomer={Boolean(access.organization.stripeCustomerId)}
      usage={{ members: memberCount, documents: documentCount, datarooms: dataroomCount }}
      limits={limits}
      checkoutResult={checkoutResult}
    />
  )
}
