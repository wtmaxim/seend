"use client"

import * as React from "react"
import { AlertCircle, ArrowRight, LoaderCircle } from "lucide-react"
import { useTranslations } from "next-intl"

import { useRouter } from "@/i18n/navigation"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/auth/password-input"
import { authClient } from "@/lib/auth-client"

export function ResetPasswordForm({ token }: { token: string | null }) {
  const t = useTranslations("auth")
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!token) {
      setError(t("reset.invalidLink"))
      return
    }

    const formData = new FormData(event.currentTarget)
    const newPassword = String(formData.get("newPassword") ?? "")
    const passwordConfirmation = String(formData.get("passwordConfirmation") ?? "")

    if (newPassword !== passwordConfirmation) {
      setError(t("reset.mismatch"))
      return
    }

    if (newPassword.length < 8 || newPassword.length > 128) {
      setError(t("reset.length"))
      return
    }

    setIsSubmitting(true)

    try {
      const result = await authClient.resetPassword({ newPassword, token })

      if (result.error) {
        setError(result.error.message || t("reset.failed"))
        return
      }

      router.replace("/login")
    } catch {
      setError(t("serviceUnreachable"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error ? (
        <Alert variant="destructive" aria-live="polite">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="newPassword">{t("reset.newPassword")}</Label>
        <PasswordInput
          id="newPassword"
          name="newPassword"
          placeholder={t("reset.newPasswordPlaceholder")}
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          autoFocus
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="passwordConfirmation">{t("reset.confirmPassword")}</Label>
        <PasswordInput
          id="passwordConfirmation"
          name="passwordConfirmation"
          placeholder={t("reset.confirmPlaceholder")}
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
          disabled={isSubmitting}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoaderCircle className="animate-spin" />
            {t("reset.submitting")}
          </>
        ) : (
          <>
            {t("reset.submit")}
            <ArrowRight data-icon="inline-end" />
          </>
        )}
      </Button>
    </form>
  )
}
