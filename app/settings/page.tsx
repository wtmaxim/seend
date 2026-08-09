import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/topbar"
import { AccountSettings } from "@/components/settings/account-settings"
import { BillingSettings } from "@/components/settings/billing-settings"
import { getDocumentAccess } from "@/lib/document-access"
import { PLAN_LIMITS, planFromSubscription } from "@/lib/plan-limits"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = { title: "Paramètres · Seend", description: "Paramètres de votre organisation." }

function formatBytes(bytes: number) {
  if (bytes <= 0) return "0 Ko"
  const units = ["o", "Ko", "Mo", "Go"]
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${(bytes / Math.pow(1024, exponent)).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const access = await getDocumentAccess()
  if (!access?.session?.user) redirect("/login")
  if (!access.membership || !access.organization) redirect("/register")

  const { checkout } = await searchParams
  const checkoutResult = checkout === "success" || checkout === "canceled" ? checkout : null

  const [documentCount, memberCount, sizeAgg, dataroomCount, subscription] = await Promise.all([
    prisma.document.count({ where: { organizationId: access.membership.organizationId } }),
    prisma.member.count({ where: { organizationId: access.membership.organizationId } }),
    prisma.document.aggregate({
      where: { organizationId: access.membership.organizationId },
      _sum: { size: true },
    }),
    prisma.dataroom.count({ where: { organizationId: access.membership.organizationId } }),
    prisma.subscription.findUnique({ where: { organizationId: access.membership.organizationId } }),
  ])

  const plan = planFromSubscription(subscription)
  const limits = PLAN_LIMITS[plan]

  const rows = [
    { label: "Nom de l'organisation", value: access.organization.name },
    { label: "Identifiant", value: access.organization.slug },
    { label: "Votre rôle", value: access.membership.role },
    { label: "Membres", value: String(memberCount) },
    { label: "Documents", value: String(documentCount) },
    { label: "Stockage utilisé", value: formatBytes(sizeAgg._sum.size || 0) },
  ]

  return (
    <>
      <Sidebar
        organizationName={access.organization.name}
        organizations={access.organizations}
        activeOrganizationId={access.membership.organizationId}
      />
      <TopBar userName={access.session.user.name || access.session.user.email} />
      <main className="ml-16 min-h-svh px-8 pb-16 pt-6">
        <div className="mx-auto max-w-6xl space-y-8">
          <div>
            <h1 className="font-serif text-3xl text-foreground">Paramètres</h1>
            <p className="mt-1 text-sm text-muted-foreground">Aperçu de votre organisation.</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 text-sm last:border-b-0"
              >
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium text-foreground">{row.value}</span>
              </div>
            ))}
          </div>

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

          <AccountSettings userEmail={access.session.user.email} />
        </div>
      </main>
    </>
  )
}
