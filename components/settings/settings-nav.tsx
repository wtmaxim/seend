"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const tabs = [
  { label: "Général", href: "/settings" },
  { label: "Équipe", href: "/settings/team" },
  { label: "Facturation", href: "/settings/billing" },
  { label: "API", href: "/settings/api" },
  { label: "Compte", href: "/settings/account" },
]

export function SettingsNav() {
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
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
