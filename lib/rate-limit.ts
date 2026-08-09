import { prisma } from "@/lib/prisma"

export type RateLimitResult = {
  allowed: boolean
  retryAfterSeconds: number
}

// Fixed-window counter stored in Postgres (via RateLimitBucket) so the limit
// holds across serverless instances, unlike an in-memory counter. The upsert
// is a single atomic statement: a fresh key starts the window, a hit past
// the previous window's resetAt rolls it over, anything else just increments.
export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const now = new Date()
  const windowEnd = new Date(now.getTime() + windowSeconds * 1000)

  const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO rate_limit_bucket (key, count, "resetAt")
    VALUES (${key}, 1, ${windowEnd})
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limit_bucket."resetAt" <= ${now} THEN 1 ELSE rate_limit_bucket.count + 1 END,
      "resetAt" = CASE WHEN rate_limit_bucket."resetAt" <= ${now} THEN ${windowEnd} ELSE rate_limit_bucket."resetAt" END
    RETURNING count, "resetAt"
  `

  const row = rows[0]
  const allowed = row.count <= limit
  const retryAfterSeconds = allowed ? 0 : Math.max(1, Math.ceil((row.resetAt.getTime() - now.getTime()) / 1000))
  return { allowed, retryAfterSeconds }
}
