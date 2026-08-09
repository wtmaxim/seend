import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/request-ip"
import {
  SHARE_EMAIL_PATTERN,
  SHARE_VISIT_COOKIE_MAX_AGE_SECONDS,
  isEmailAllowed,
  isShareLinkActive,
  normalizeShareEmail,
  shareVisitCookieName,
} from "@/lib/share-link"

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const ip = getClientIp(request.headers) || "unknown"

  const rateLimit = await checkRateLimit(`view:visit:${ip}`, 20, 300)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Trop de requêtes, réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    )
  }

  const shareLink = await prisma.shareLink.findUnique({ where: { token } })
  if (!shareLink || !isShareLinkActive(shareLink)) {
    return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 })
  }

  const body = (await request.json().catch(() => null)) as { email?: string; name?: string } | null
  const email = body?.email ? normalizeShareEmail(body.email).slice(0, 255) : null
  const name = body?.name?.trim().slice(0, 255) || null

  // Only enforce what this link actually asks for. A field that isn't
  // required is still stored when the visitor volunteers it, but an invalid
  // value is rejected either way rather than silently kept.
  if (shareLink.requireEmail && !email) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 })
  }
  if (email && !SHARE_EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 })
  }
  if (shareLink.requireName && !name) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 })
  }
  if (!isEmailAllowed(email, shareLink.allowedEmails)) {
    return NextResponse.json({ error: "Cet email n'est pas autorisé à accéder à ce document." }, { status: 403 })
  }

  const visit = await prisma.shareLinkVisit.create({
    data: {
      shareLinkId: shareLink.id,
      visitorEmail: email,
      visitorName: name,
      ipAddress: ip === "unknown" ? null : ip,
      userAgent: request.headers.get("user-agent") || null,
    },
  })

  const response = NextResponse.json({ ok: true })
  response.cookies.set(shareVisitCookieName(token), visit.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SHARE_VISIT_COOKIE_MAX_AGE_SECONDS,
  })
  return response
}
