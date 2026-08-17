import { NextResponse } from "next/server"

import { hashApiKey, isApiKeyFormat } from "@/lib/api-key"
import { PLAN_LIMITS, planFromSubscription, type PlanId } from "@/lib/plan-limits"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"

export type ApiContext = {
  organizationId: string
  apiKeyId: string
  // API calls have no signed-in user; rows that need an author are attributed
  // to whoever created the key.
  actorUserId: string
  plan: PlanId
  limits: (typeof PLAN_LIMITS)[PlanId]
}

export function apiError(status: number, error: string, extraHeaders?: HeadersInit) {
  return NextResponse.json({ error }, { status, headers: extraHeaders })
}

/**
 * Authenticates a request against `Authorization: Bearer seend_...`.
 * Returns either a context to work with, or the Response to return as-is.
 */
export async function authenticateApiRequest(
  request: Request
): Promise<{ context: ApiContext; response?: never } | { context?: never; response: NextResponse }> {
  const header = request.headers.get("authorization")
  const token = header?.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null

  if (!token || !isApiKeyFormat(token)) {
    return { response: apiError(401, "Clé API manquante ou invalide") }
  }

  // Look the key up by hash: the plaintext is never stored, and an index hit on
  // a 64-char digest is constant-work regardless of which key was supplied.
  const apiKey = await prisma.apiKey.findUnique({
    where: { hash: hashApiKey(token) },
    select: { id: true, organizationId: true, createdById: true, revokedAt: true },
  })

  if (!apiKey || apiKey.revokedAt) {
    return { response: apiError(401, "Clé API manquante ou invalide") }
  }

  const rateLimit = await checkRateLimit(`api:${apiKey.id}`, 300, 60)
  if (!rateLimit.allowed) {
    return {
      response: apiError(429, "Trop de requêtes", { "Retry-After": String(rateLimit.retryAfterSeconds) }),
    }
  }

  const subscription = await prisma.subscription.findUnique({
    where: { organizationId: apiKey.organizationId },
    select: { plan: true, status: true },
  })
  const plan = planFromSubscription(subscription)
  const limits = PLAN_LIMITS[plan]

  if (!limits.api) {
    return { response: apiError(403, "L'accès API nécessite le plan Business") }
  }

  // Best-effort usage stamp; a failure here must not fail the request.
  void prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch((error: unknown) => console.error("[api-auth] lastUsedAt update failed", error))

  return {
    context: {
      organizationId: apiKey.organizationId,
      apiKeyId: apiKey.id,
      actorUserId: apiKey.createdById,
      plan,
      limits,
    },
  }
}
