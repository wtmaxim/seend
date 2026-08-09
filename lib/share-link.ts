import { randomUUID } from "crypto"

export function generateShareToken() {
  return randomUUID().replace(/-/g, "")
}

export function shareVisitCookieName(token: string) {
  return `sv_${token}`
}

export function isShareLinkActive(link: { revoked: boolean; expiresAt: Date | null }) {
  if (link.revoked) return false
  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) return false
  return true
}

export const SHARE_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeShareEmail(email: string) {
  return email.trim().toLowerCase()
}

/** Empty allowlist means unrestricted — anyone who passes the gate is in. */
export function isEmailAllowed(email: string | null, allowedEmails: string[]) {
  if (allowedEmails.length === 0) return true
  return email !== null && allowedEmails.includes(normalizeShareEmail(email))
}

// How long the visitor's identity cookie stays valid, so they don't have to
// re-enter their email every time they reopen the link.
export const SHARE_VISIT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12

// A gap longer than this between heartbeats means the visitor left and came
// back later, not that they kept the tab open — start a fresh visit (same
// identity, reset duration) instead of folding the gap into the old one.
export const SHARE_VISIT_SESSION_TIMEOUT_SECONDS = 60 * 5
