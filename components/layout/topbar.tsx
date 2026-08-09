"use client"

import { LogOut, Search, Settings } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { authClient } from "@/lib/auth-client"

export function TopBar({ userName }: { userName?: string }) {
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
        <span>Rechercher</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex size-9 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-foreground outline-none transition-colors hover:bg-white/15"
          aria-label={userName ? `Menu de ${userName}` : "Menu du compte"}
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
            Paramètres
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void handleSignOut()}>
            <LogOut />
            Se déconnecter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
