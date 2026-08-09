"use client"

import { Loader2, Mail, Plus, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

type MemberItem = { id: string; name: string; email: string; role: string }
type InvitationItem = { id: string; email: string; role: string; createdAt: string }

const selectClassName =
  "w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40"
const inputClassName =
  "w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground/40"

export function TeamClient({
  organizationId,
  members,
  invitations,
  canManage,
}: {
  organizationId: string
  members: MemberItem[]
  invitations: InvitationItem[]
  canManage: boolean
}) {
  const router = useRouter()
  const [inviting, setInviting] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"member" | "admin">("member")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelingId, setCancelingId] = useState<string | null>(null)

  async function sendInvite() {
    if (!email.trim()) return setError("L'email est requis.")
    setSubmitting(true)
    setError(null)
    const result = await authClient.organization.inviteMember({
      email: email.trim(),
      role,
      organizationId,
    })
    setSubmitting(false)
    if (result.error) return setError(result.error.message || "L'invitation a échoué.")
    setInviting(false)
    setEmail("")
    setRole("member")
    router.refresh()
  }

  async function cancelInvitation(invitationId: string) {
    setCancelingId(invitationId)
    setError(null)
    const result = await authClient.organization.cancelInvitation({ invitationId })
    setCancelingId(null)
    if (result.error) return setError(result.error.message || "L'annulation a échoué.")
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="rounded-2xl border border-border p-5">
          {inviting ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                <input
                  autoFocus
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="email@exemple.com"
                  className={inputClassName}
                  disabled={submitting}
                />
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value as "member" | "admin")}
                  className={selectClassName}
                  disabled={submitting}
                >
                  <option value="member">Membre</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex items-center gap-2">
                <Button onClick={() => void sendInvite()} disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin" /> : null}
                  Envoyer l&apos;invitation
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setInviting(false)
                    setError(null)
                  }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setInviting(true)}
              className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Plus className="size-4" />
              Inviter un membre
            </button>
          )}
        </div>
      )}

      {!inviting && error && <p className="text-xs text-destructive">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-border">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 last:border-b-0"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-foreground">
                {(member.name || member.email).slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{member.name || member.email}</p>
                <p className="truncate text-xs text-muted-foreground">{member.email}</p>
              </div>
            </div>
            <span className="shrink-0 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground">
              {member.role}
            </span>
          </div>
        ))}
      </div>

      {canManage && invitations.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="border-b border-border bg-muted/40 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Invitations en attente
          </div>
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Mail className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm">{invitation.email}</span>
                <span className="shrink-0 rounded-lg border border-border px-2 py-0.5 text-xs text-muted-foreground">
                  {invitation.role}
                </span>
              </div>
              <Button
                variant="destructive"
                size="icon-xs"
                disabled={cancelingId === invitation.id}
                onClick={() => void cancelInvitation(invitation.id)}
                aria-label={`Annuler l'invitation de ${invitation.email}`}
              >
                {cancelingId === invitation.id ? <Loader2 className="animate-spin" /> : <X />}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
