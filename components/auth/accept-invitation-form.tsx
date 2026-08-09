"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, LoaderCircle } from "lucide-react"

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
        setError(result.error.message || "Unable to process this invitation.")
        return
      }

      router.replace("/")
      router.refresh()
    } catch {
      setError("Unable to reach the authentication service. Try again.")
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
          Accept
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          disabled={pending !== null}
          onClick={() => void respond("reject")}
        >
          {pending === "reject" ? <LoaderCircle className="animate-spin" /> : null}
          Decline
        </Button>
      </div>
    </div>
  )
}
