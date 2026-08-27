"use client"

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/auth/password-input"
import { useRouter } from "@/i18n/navigation"
import { authClient } from "@/lib/auth-client"

export function AccountSettings({ userEmail }: { userEmail: string }) {
  const t = useTranslations("account")
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
      setPasswordError(t("passwordMismatch"))
      return
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      setPasswordError(t("passwordLength"))
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
      setPasswordError(result.error.message || t("changeFailed"))
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

    if (!window.confirm(t("deleteConfirm"))) return

    setDeleting(true)
    const result = await authClient.deleteUser({ password: deletePassword })
    setDeleting(false)

    if (result.error) {
      setDeleteError(result.error.message || t("deleteFailed"))
      return
    }

    router.replace("/login")
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={changePassword} className="rounded-2xl border border-border p-5">
        <h2 className="mb-1 text-sm font-medium text-foreground">{t("passwordTitle")}</h2>
        <p className="mb-4 text-xs text-muted-foreground">{t("signedInAs", { email: userEmail })}</p>

        {passwordError && (
          <Alert variant="destructive" className="mb-3">
            <AlertCircle />
            <AlertDescription>{passwordError}</AlertDescription>
          </Alert>
        )}
        {passwordSuccess && (
          <Alert className="mb-3">
            <CheckCircle2 />
            <AlertDescription>{t("passwordUpdated")}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <PasswordInput
            placeholder={t("currentPassword")}
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
            disabled={changingPassword}
          />
          <PasswordInput
            placeholder={t("newPassword")}
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            disabled={changingPassword}
          />
          <PasswordInput
            placeholder={t("confirmNewPassword")}
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
          {t("changePassword")}
        </Button>
      </form>

      <form onSubmit={deleteAccount} className="rounded-2xl border border-destructive/30 p-5">
        <h2 className="mb-1 text-sm font-medium text-destructive">{t("deleteTitle")}</h2>
        <p className="mb-4 text-xs text-muted-foreground">{t("deleteDescription")}</p>

        {deleteError && (
          <Alert variant="destructive" className="mb-3">
            <AlertCircle />
            <AlertDescription>{deleteError}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <PasswordInput
            placeholder={t("confirmPassword")}
            autoComplete="current-password"
            value={deletePassword}
            onChange={(event) => setDeletePassword(event.target.value)}
            required
            disabled={deleting}
            className="max-w-xs"
          />
          <Button type="submit" variant="destructive" disabled={deleting}>
            {deleting ? <Loader2 className="animate-spin" /> : null}
            {t("deletePermanently")}
          </Button>
        </div>
      </form>
    </div>
  )
}
