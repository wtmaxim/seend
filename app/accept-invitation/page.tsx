import type { Metadata } from "next"
import Link from "next/link"
import { headers } from "next/headers"

import { AcceptInvitationForm } from "@/components/auth/accept-invitation-form"
import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Invitation · Seend",
  description: "Accept an invitation to join an organization on Seend.",
}

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })

  if (!id) {
    return (
      <AuthShell
        title="Invalid invitation"
        description="This invitation link is missing or malformed."
        footerText="Need help?"
        footerLabel="Back to sign in"
        footerHref="/login"
      >
        <p className="text-sm text-muted-foreground">Ask whoever invited you to send a new link.</p>
      </AuthShell>
    )
  }

  if (!session?.user) {
    return (
      <AuthShell
        title="You've been invited"
        description="Sign in or create an account with the email that received this invitation, then open this link again."
        footerText="Need help?"
        footerLabel="Back to sign in"
        footerHref="/login"
      >
        <div className="space-y-2">
          <Button asChild className="w-full">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/register">Create an account</Link>
          </Button>
        </div>
      </AuthShell>
    )
  }

  const invitation = await auth.api
    .getInvitation({ query: { id }, headers: requestHeaders })
    .catch(() => null)

  if (!invitation) {
    return (
      <AuthShell
        title="Invitation unavailable"
        description="This invitation is invalid, expired, or wasn't sent to your account's email address."
        footerText="Need help?"
        footerLabel="Back to dashboard"
        footerHref="/"
      >
        <p className="text-sm text-muted-foreground">Ask whoever invited you to send a new link.</p>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="You've been invited"
      description={`Join ${invitation.organizationName} on Seend.`}
      footerText="Wrong account?"
      footerLabel="Back to dashboard"
      footerHref="/"
    >
      <AcceptInvitationForm
        invitationId={invitation.id}
        organizationName={invitation.organizationName}
        inviterEmail={invitation.inviterEmail}
      />
    </AuthShell>
  )
}
