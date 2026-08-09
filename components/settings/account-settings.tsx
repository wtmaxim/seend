"use client"

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/auth/password-input"
import { authClient } from "@/lib/auth-client"

export function AccountSettings({ userEmail }: { userEmail: string }) {
  const router = useRouter()

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const [deletePassword, setDeletePassword] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    if (newPassword !== newPasswordConfirmation) {
      setPasswordError("Les mots de passe ne correspondent pas.")
      return
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      setPasswordError("Le mot de passe doit contenir entre 8 et 128 caractères.")
      return
    }

    setChangingPassword(true)
    const result = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    })
    setChangingPassword(false)

    if (result.error) {
      setPasswordError(result.error.message || "Le changement de mot de passe a échoué.")
      return
    }

    setCurrentPassword("")
    setNewPassword("")
    setNewPasswordConfirmation("")
    setPasswordSuccess(true)
  }

  async function deleteAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setDeleteError(null)

    if (!window.confirm("Supprimer définitivement ton compte ? Cette action est irréversible.")) return

    setDeleting(true)
    const result = await authClient.deleteUser({ password: deletePassword })
    setDeleting(false)

    if (result.error) {
      setDeleteError(result.error.message || "La suppression a échoué.")
      return
    }

    router.replace("/login")
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={changePassword} className="rounded-2xl border border-border p-5">
        <h2 className="mb-1 text-sm font-medium text-foreground">Mot de passe</h2>
        <p className="mb-4 text-xs text-muted-foreground">Connecté en tant que {userEmail}.</p>

        {passwordError && (
          <Alert variant="destructive" className="mb-3">
            <AlertCircle />
            <AlertDescription>{passwordError}</AlertDescription>
          </Alert>
        )}
        {passwordSuccess && (
          <Alert className="mb-3">
            <CheckCircle2 />
            <AlertDescription>Mot de passe mis à jour.</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <PasswordInput
            placeholder="Mot de passe actuel"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
            disabled={changingPassword}
          />
          <PasswordInput
            placeholder="Nouveau mot de passe"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            disabled={changingPassword}
          />
          <PasswordInput
            placeholder="Confirmer le nouveau mot de passe"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            value={newPasswordConfirmation}
            onChange={(event) => setNewPasswordConfirmation(event.target.value)}
            required
            disabled={changingPassword}
          />
        </div>

        <Button type="submit" className="mt-4" disabled={changingPassword}>
          {changingPassword ? <Loader2 className="animate-spin" /> : null}
          Changer le mot de passe
        </Button>
      </form>

      <form onSubmit={deleteAccount} className="rounded-2xl border border-destructive/30 p-5">
        <h2 className="mb-1 text-sm font-medium text-destructive">Supprimer le compte</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Définitif. Tu perds l&apos;accès à ce compte ; les organisations dont tu es le seul membre restent
          intactes mais sans propriétaire.
        </p>

        {deleteError && (
          <Alert variant="destructive" className="mb-3">
            <AlertCircle />
            <AlertDescription>{deleteError}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <PasswordInput
            placeholder="Confirme ton mot de passe"
            autoComplete="current-password"
            value={deletePassword}
            onChange={(event) => setDeletePassword(event.target.value)}
            required
            disabled={deleting}
            className="max-w-xs"
          />
          <Button type="submit" variant="destructive" disabled={deleting}>
            {deleting ? <Loader2 className="animate-spin" /> : null}
            Supprimer définitivement
          </Button>
        </div>
      </form>
    </div>
  )
}
