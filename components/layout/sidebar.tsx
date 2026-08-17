"use client"

import { Check, FileText, FolderOpen, LayoutGrid, Loader2, Plus, Settings, Sparkle } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { authClient } from "@/lib/auth-client"
import { isValidOrganizationSlug, toOrganizationSlug } from "@/lib/organization-slug"
import { cn } from "@/lib/utils"

const navItems = [
  { icon: LayoutGrid, label: "Accueil", href: "/" },
  { icon: FileText, label: "Documents", href: "/documents" },
  { icon: FolderOpen, label: "Datarooms", href: "/datarooms" },
]

type OrganizationItem = { id: string; name: string }

export function Sidebar({
  organizationName,
  organizations = [],
  activeOrganizationId,
}: {
  organizationName?: string
  organizations?: OrganizationItem[]
  activeOrganizationId?: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [switching, setSwitching] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  async function switchOrganization(organizationId: string) {
    if (organizationId === activeOrganizationId) return
    setSwitching(organizationId)
    await authClient.organization.setActive({ organizationId })
    setSwitching(null)
    router.push("/")
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-svh w-16 flex-col items-center gap-6 border-r border-border bg-background py-5">
      <Link href="/" className="flex size-8 items-center justify-center text-foreground">
        <Sparkle className="size-5" />
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-[11px] font-medium text-foreground outline-none transition-colors hover:bg-white/15"
          aria-label="Changer d'organisation"
          title={organizationName}
        >
          {organizationName?.slice(0, 1).toUpperCase() || "?"}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={12}>
          {organizations.map((organization) => (
            <DropdownMenuItem
              key={organization.id}
              disabled={switching !== null}
              onClick={() => void switchOrganization(organization.id)}
            >
              {organization.id === activeOrganizationId ? <Check /> : <span className="size-4" />}
              <span className="truncate">{organization.name}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreating(true)}>
            <Plus />
            Créer une organisation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <nav className="flex flex-1 flex-col gap-1.5">
        {navItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "rounded-xl p-2.5 transition-colors",
                active
                  ? "bg-white/10 text-foreground"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <item.icon className="size-[18px]" />
            </Link>
          )
        })}
      </nav>

      <Link
        href="/settings"
        title="Paramètres"
        className={cn(
          "rounded-xl p-2.5 transition-colors",
          pathname?.startsWith("/settings")
            ? "bg-white/10 text-foreground"
            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
        )}
      >
        <Settings className="size-[18px]" />
      </Link>

      <CreateOrganizationSheet open={creating} onOpenChange={setCreating} />
    </aside>
  )
}

function CreateOrganizationSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugWasEdited, setSlugWasEdited] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateName(value: string) {
    setName(value)
    if (!slugWasEdited) setSlug(toOrganizationSlug(value))
  }

  async function createOrganization() {
    setError(null)
    const trimmedName = name.trim()
    const trimmedSlug = slug.trim()

    if (!trimmedName) return setError("Le nom est requis.")
    if (!isValidOrganizationSlug(trimmedSlug)) {
      return setError("L'identifiant doit contenir des lettres minuscules, chiffres et tirets simples.")
    }

    setSubmitting(true)
    const result = await authClient.organization.create({ name: trimmedName, slug: trimmedSlug })
    setSubmitting(false)

    if (result.error) return setError(result.error.message || "La création a échoué.")

    setName("")
    setSlug("")
    setSlugWasEdited(false)
    onOpenChange(false)
    router.push("/")
    router.refresh()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Créer une organisation</SheetTitle>
          <SheetDescription>Tu deviendras propriétaire de cette nouvelle organisation.</SheetDescription>
        </SheetHeader>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-org-name">Nom de l&apos;organisation</Label>
            <Input
              id="new-org-name"
              placeholder="Acme Inc."
              value={name}
              onChange={(event) => updateName(event.target.value)}
              disabled={submitting}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-org-slug">Identifiant</Label>
            <Input
              id="new-org-slug"
              placeholder="acme-inc"
              value={slug}
              onChange={(event) => {
                setSlugWasEdited(true)
                setSlug(toOrganizationSlug(event.target.value))
              }}
              disabled={submitting}
            />
          </div>
        </div>

        <SheetFooter>
          <Button onClick={() => void createOrganization()} disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" /> : null}
            Créer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
