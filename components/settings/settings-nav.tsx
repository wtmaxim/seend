"use client"

import { useTranslations } from "next-intl"

import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

const tabs = [
  { key: "general", href: "/settings" },
  { key: "team", href: "/settings/team" },
  { key: "billing", href: "/settings/billing" },
  { key: "api", href: "/settings/api" },
  { key: "account", href: "/settings/account" },
] as const

export function SettingsNav() {
  const t = useTranslations("settings.tabs")
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 border-b border-border">
      {tabs.map((tab) => {
        const active = tab.href === "/settings" ? pathname === "/settings" : pathname?.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "border-b-2 px-1 pb-3 text-sm transition-colors",
              active
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t(tab.key)}
          </Link>
        )
      })}
    </nav>
  )
}
