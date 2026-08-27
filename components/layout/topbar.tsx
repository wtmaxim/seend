"use client"

import { LogOut, Search, Settings } from "lucide-react"
import { useTranslations } from "next-intl"

import { LocaleSwitcher } from "@/components/layout/locale-switcher"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Link, useRouter } from "@/i18n/navigation"
import { authClient } from "@/lib/auth-client"

export function TopBar({ userName }: { userName?: string }) {
  const t = useTranslations("nav")
  const router = useRouter()
  const initial = userName?.slice(0, 1).toUpperCase() || "?"

  async function handleSignOut() {
    await authClient.signOut()
    router.replace("/login")
    router.refresh()
  }

  return (
    <div className="ml-16 flex items-center justify-between px-8 pt-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Search className="size-4" />
        <span>{t("search")}</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex size-9 items-center justify-center rounded-none bg-white/10 text-xs font-medium text-foreground outline-none transition-colors hover:bg-white/15"
          aria-label={userName ? t("userMenu", { name: userName }) : t("accountMenu")}
        >
          {initial}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {userName ? (
            <div className="truncate px-2.5 py-1.5 text-xs text-muted-foreground">{userName}</div>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/settings" />}>
            <Settings />
            {t("settings")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="px-2.5 py-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            {t("language")}
          </div>
          <LocaleSwitcher />
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void handleSignOut()}>
            <LogOut />
            {t("signOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
