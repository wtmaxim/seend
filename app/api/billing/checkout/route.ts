import { NextResponse } from "next/server"

import { getDocumentAccess } from "@/lib/document-access"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { type BillingInterval, type PaidPlanId, priceIdFor } from "@/lib/stripe-plans"

export async function POST(request: Request) {
  const access = await getDocumentAccess()
  if (!access?.membership || !access.organization) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  if (access.membership.role !== "owner") {
    return NextResponse.json({ error: "Seul le propriétaire peut gérer la facturation" }, { status: 403 })
  }

  const body = (await request.json().catch(() => null)) as { plan?: string; interval?: string } | null
  const plan = body?.plan
  const interval = body?.interval
  if ((plan !== "pro" && plan !== "business") || (interval !== "month" && interval !== "year")) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
  }

  const priceId = priceIdFor(plan as PaidPlanId, interval as BillingInterval)
  if (!priceId) return NextResponse.json({ error: "Plan indisponible" }, { status: 400 })

  let customerId = access.organization.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: access.session.user.email,
      name: access.organization.name,
      metadata: { organizationId: access.organization.id },
    })
    customerId = customer.id
    await prisma.organization.update({ where: { id: access.organization.id }, data: { stripeCustomerId: customerId } })
  }

  const hadSubscriptionBefore = await prisma.subscription.findUnique({ where: { organizationId: access.organization.id } })

  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000"
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      metadata: { organizationId: access.organization.id },
      trial_period_days: hadSubscriptionBefore ? undefined : 14,
    },
    metadata: { organizationId: access.organization.id },
    success_url: `${baseUrl}/settings/billing?checkout=success`,
    cancel_url: `${baseUrl}/settings/billing?checkout=canceled`,
  })

  return NextResponse.json({ url: session.url })
}
