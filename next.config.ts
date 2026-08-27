import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

const nextConfig: NextConfig = {
  // mupdf ships as a WASM module loaded at runtime. Bundling it breaks that
  // loading, so it has to stay an external require on the server.
  serverExternalPackages: ["mupdf"],
}

export default withNextIntl(nextConfig)
