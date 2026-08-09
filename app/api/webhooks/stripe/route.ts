import { NextResponse } from "next/server"
import type Stripe from "stripe"

import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { planFromPriceId } from "@/lib/stripe-plans"

async function syncSubscription(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata.organizationId
  if (!organizationId) {
    console.error("[webhooks/stripe] Subscription missing organizationId metadata", subscription.id)
    return
  }

  const item = subscription.items.data[0]
  const mapped = item ? planFromPriceId(item.price.id) : null
  if (!mapped) {
    console.error("[webhooks/stripe] Unknown price on subscription", subscription.id)
    return
  }

  // Stripe represents a scheduled cancellation via `cancel_at_period_end`
  // only while status=active; a trialing subscription cancelled "at period
  // end" instead gets a `cancel_at` timestamp with `cancel_at_period_end`
  // left false, so both must be checked.
  const cancelAtPeriodEnd = subscription.cancel_at_period_end || subscription.cancel_at !== null

  await prisma.subscription.upsert({
    where: { organizationId },
    create: {
      organizationId,
      stripeSubscriptionId: subscription.id,
      plan: mapped.plan,
      interval: mapped.interval,
      status: subscription.status,
      currentPeriodEnd: new Date(item.current_period_end * 1000),
      cancelAtPeriodEnd,
    },
    update: {
      stripeSubscriptionId: subscription.id,
      plan: mapped.plan,
      interval: mapped.interval,
      status: subscription.status,
      currentPeriodEnd: new Date(item.current_period_end * 1000),
      cancelAtPeriodEnd,
    },
  })
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!signature || !webhookSecret) return NextResponse.json({ error: "Missing signature" }, { status: 400 })

  const rawBody = await request.text()
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret)
  } catch (error) {
    console.error("[webhooks/stripe] Signature verification failed", error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object)
        break
      default:
        break
    }
  } catch (error) {
    console.error("[webhooks/stripe] Handler failed", event.type, error)
    return NextResponse.json({ error: "Handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
