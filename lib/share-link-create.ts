import { SHARE_EMAIL_PATTERN, generateShareToken, normalizeShareEmail } from "@/lib/share-link"

/** Fields a caller can set when creating a share link, regardless of target. */
export type ShareLinkOptionsInput = {
  label?: string
  expiresInDays?: number
  requireName?: boolean
  requireEmail?: boolean
  allowedEmails?: string[]
  watermark?: boolean
}

/**
 * Normalizes the options shared by document and dataroom share links into
 * Prisma create data. The caller still supplies exactly one of
 * `documentId`/`dataroomId` and the identifying fields (organizationId,
 * createdById) — this only owns the part that's identical either way.
 */
export function buildShareLinkOptions(body: ShareLinkOptionsInput | null) {
  const label = body?.label?.trim().slice(0, 255) || null
  const expiresAt =
    body?.expiresInDays && body.expiresInDays > 0
      ? new Date(Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000)
      : null

  // Silently drop malformed entries rather than rejecting the whole request
  // over a typo — the list is a convenience allowlist, not a security
  // boundary that needs strict validation.
  const allowedEmails = Array.from(
    new Set(
      (body?.allowedEmails ?? [])
        .map((email) => normalizeShareEmail(email))
        .filter((email) => SHARE_EMAIL_PATTERN.test(email))
    )
  )

  return {
    token: generateShareToken(),
    label,
    expiresAt,
    requireName: body?.requireName ?? true,
    // An email allowlist only works if an email is actually collected.
    requireEmail: allowedEmails.length > 0 ? true : (body?.requireEmail ?? true),
    allowedEmails,
    watermark: body?.watermark ?? false,
  }
}
