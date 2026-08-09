"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowRight, LoaderCircle } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/auth/password-input"
import { authClient } from "@/lib/auth-client"

export function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!token) {
      setError("This reset link is invalid or has expired.")
      return
    }

    const formData = new FormData(event.currentTarget)
    const newPassword = String(formData.get("newPassword") ?? "")
    const passwordConfirmation = String(formData.get("passwordConfirmation") ?? "")

    if (newPassword !== passwordConfirmation) {
      setError("Passwords do not match.")
      return
    }

    if (newPassword.length < 8 || newPassword.length > 128) {
      setError("Password must be between 8 and 128 characters.")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await authClient.resetPassword({ newPassword, token })

      if (result.error) {
        setError(result.error.message || "Unable to reset your password.")
        return
      }

      router.replace("/login")
    } catch {
      setError("Unable to reach the authentication service. Try again.")
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
        <Label htmlFor="newPassword">New password</Label>
        <PasswordInput
          id="newPassword"
          name="newPassword"
          placeholder="8–128 characters"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          autoFocus
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="passwordConfirmation">Confirm password</Label>
        <PasswordInput
          id="passwordConfirmation"
          name="passwordConfirmation"
          placeholder="Repeat password"
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
            Resetting password
          </>
        ) : (
          <>
            Reset password
            <ArrowRight data-icon="inline-end" />
          </>
        )}
      </Button>
    </form>
  )
}
