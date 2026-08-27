import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { headers } from "next/headers"

import { AcceptInvitationForm } from "@/components/auth/accept-invitation-form"
import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta.invitation")
  return { title: t("title"), description: t("description") }
}

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const t = await getTranslations("auth")
  const { id } = await searchParams
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })

  if (!id) {
    return (
      <AuthShell
        title={t("invitation.invalidTitle")}
        description={t("invitation.invalidDescription")}
        footerText={t("invitation.needHelp")}
        footerLabel={t("invitation.backToSignIn")}
        footerHref="/login"
      >
        <p className="text-sm text-muted-foreground">Ask whoever invited you to send a new link.</p>
      </AuthShell>
    )
  }

  if (!session?.user) {
    return (
      <AuthShell
        title={t("invitation.invitedTitle")}
        description={t("invitation.signInDescription")}
        footerText={t("invitation.needHelp")}
        footerLabel={t("invitation.backToSignIn")}
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
        title={t("invitation.unavailableTitle")}
        description={t("invitation.unavailableDescription")}
        footerText={t("invitation.needHelp")}
        footerLabel={t("invitation.backToDashboard")}
        footerHref="/"
      >
        <p className="text-sm text-muted-foreground">Ask whoever invited you to send a new link.</p>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={t("invitation.invitedTitle")}
      description={t("invitation.joinDescription", { organization: invitation.organizationName })}
      footerText={t("invitation.wrongAccount")}
      footerLabel={t("invitation.backToDashboard")}
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
