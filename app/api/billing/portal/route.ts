import { NextResponse } from "next/server"

import { getDocumentAccess } from "@/lib/document-access"
import { stripe } from "@/lib/stripe"

export async function POST() {
  const access = await getDocumentAccess()
  if (!access?.membership || !access.organization) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  if (access.membership.role !== "owner") {
    return NextResponse.json({ error: "Seul le propriétaire peut gérer la facturation" }, { status: 403 })
  }
  if (!access.organization.stripeCustomerId) {
    return NextResponse.json({ error: "Aucun abonnement à gérer" }, { status: 400 })
  }

  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000"
  const session = await stripe.billingPortal.sessions.create({
    customer: access.organization.stripeCustomerId,
    return_url: `${baseUrl}/settings`,
  })

  return NextResponse.json({ url: session.url })
}
