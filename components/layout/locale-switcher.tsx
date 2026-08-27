"use client"

import { Check } from "lucide-react"
import { useLocale } from "next-intl"
import { useTransition } from "react"

import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { usePathname, useRouter } from "@/i18n/navigation"
import { LOCALE_LABELS, locales, type Locale } from "@/i18n/routing"

/**
 * One dropdown row per language, meant to be dropped into an existing menu —
 * the design system has no submenu primitive, so the languages sit flat
 * alongside the other items.
 *
 * Switching keeps the visitor on the current page: `usePathname` returns the
 * route without its locale prefix, so the router can re-render the same route
 * under a different one.
 */
export function LocaleSwitcher() {
  const activeLocale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function selectLocale(locale: Locale) {
    if (locale === activeLocale) return
    startTransition(() => {
      router.replace(pathname, { locale })
      router.refresh()
    })
  }

  return (
    <>
      {locales.map((locale) => (
        <DropdownMenuItem key={locale} disabled={isPending} onClick={() => selectLocale(locale)}>
          {locale === activeLocale ? <Check /> : <span className="size-4" />}
          {LOCALE_LABELS[locale]}
        </DropdownMenuItem>
      ))}
    </>
  )
}
