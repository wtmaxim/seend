"use client"

import * as React from "react"
import { AlertCircle, LoaderCircle } from "lucide-react"
import { useTranslations } from "next-intl"

import { useRouter } from "@/i18n/navigation"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

export function AcceptInvitationForm({
  invitationId,
  organizationName,
  inviterEmail,
}: {
  invitationId: string
  organizationName: string
  inviterEmail: string
}) {
  const t = useTranslations("auth")
  const router = useRouter()
  const [pending, setPending] = React.useState<"accept" | "reject" | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  async function respond(action: "accept" | "reject") {
    setError(null)
    setPending(action)

    try {
      const result =
        action === "accept"
          ? await authClient.organization.acceptInvitation({ invitationId })
          : await authClient.organization.rejectInvitation({ invitationId })

      if (result.error) {
        setError(result.error.message || t("invitation.failed"))
        return
      }

      router.replace("/")
      router.refresh()
    } catch {
      setError(t("serviceUnreachable"))
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Invited by <span className="text-foreground">{inviterEmail}</span> to join{" "}
        <span className="font-medium text-foreground">{organizationName}</span>.
      </p>

      {error ? (
        <Alert variant="destructive" aria-live="polite">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex gap-2">
        <Button className="flex-1" disabled={pending !== null} onClick={() => void respond("accept")}>
          {pending === "accept" ? <LoaderCircle className="animate-spin" /> : null}
          {t("invitation.accept")}
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          disabled={pending !== null}
          onClick={() => void respond("reject")}
        >
          {pending === "reject" ? <LoaderCircle className="animate-spin" /> : null}
          {t("invitation.decline")}
        </Button>
      </div>
    </div>
  )
}
