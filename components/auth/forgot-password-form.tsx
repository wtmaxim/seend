"use client"

import * as React from "react"
import { AlertCircle, ArrowRight, LoaderCircle, MailCheck } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"

export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [sent, setSent] = React.useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim()

    try {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      })

      if (result.error) {
        setError(result.error.message || "Unable to send the reset email.")
        return
      }

      setSent(true)
    } catch {
      setError("Unable to reach the authentication service. Try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (sent) {
    return (
      <Alert>
        <MailCheck />
        <AlertDescription>
          If an account exists for that email, a reset link is on its way. Check your inbox.
        </AlertDescription>
      </Alert>
    )
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
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          autoFocus
          required
          disabled={isSubmitting}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoaderCircle className="animate-spin" />
            Sending link
          </>
        ) : (
          <>
            Send reset link
            <ArrowRight data-icon="inline-end" />
          </>
        )}
      </Button>
    </form>
  )
}
