import { defineRouting } from "next-intl/routing"

export const locales = ["fr", "en"] as const
export type Locale = (typeof locales)[number]

export const LOCALE_LABELS: Record<Locale, string> = {
  fr: "Français",
  en: "English",
}

export const routing = defineRouting({
  locales,
  // French is what the app was written in, so it stays the fallback for
  // anything a catalogue hasn't translated yet.
  defaultLocale: "fr",
  // Every URL carries its locale, including the default one, so a link is
  // never ambiguous about which language the recipient will see.
  localePrefix: "always",
})
