import { createNavigation } from "next-intl/navigation"

import { routing } from "@/i18n/routing"

/**
 * Locale-aware replacements for `next/link` and `next/navigation`. Import
 * these instead of the Next.js originals anywhere inside `app/[locale]`:
 * they take an unprefixed path (`/settings/billing`) and keep the visitor in
 * the locale they're already browsing.
 *
 * The Next.js originals are still correct in API routes and when building
 * absolute URLs for emails or Stripe, where there is no active locale — the
 * middleware negotiates one from the request instead.
 *
 * Server Components also keep using `redirect` from `next/navigation` with an
 * unprefixed path. The one here needs the locale passed in, which means
 * resolving it asynchronously, and `await redirect(...)` loses the `never`
 * return type that lets TypeScript narrow the value just checked. Redirecting
 * to `/login` unprefixed costs one extra middleware hop and lands on the
 * visitor's own locale via the NEXT_LOCALE cookie, which is what we want
 * anyway.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
