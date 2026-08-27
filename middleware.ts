import createMiddleware from "next-intl/middleware"

import { routing } from "@/i18n/routing"

export default createMiddleware(routing)

export const config = {
  // Everything except API routes, Next.js internals and files with an
  // extension. Share links and invitation emails point at unprefixed paths on
  // purpose — they land here and get redirected to the recipient's own
  // language rather than to whichever one the sender happened to be using.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
}
