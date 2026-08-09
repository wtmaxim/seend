import type { Metadata } from "next"

import { AuthShell } from "@/components/auth/auth-shell"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export const metadata: Metadata = {
  title: "New password · Seend",
  description: "Choose a new password for your Seend account.",
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  return (
    <AuthShell
      title="Choose a new password"
      description="This link is single-use and expires after an hour."
      footerText="Changed your mind?"
      footerLabel="Back to sign in"
      footerHref="/login"
    >
      <ResetPasswordForm token={token ?? null} />
    </AuthShell>
  )
}
