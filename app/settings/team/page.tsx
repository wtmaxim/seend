import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { TeamClient } from "@/components/team/team-client"
import { getDocumentAccess } from "@/lib/document-access"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = { title: "Équipe · Seend", description: "Les membres de votre organisation." }

export default async function SettingsTeamPage() {
  const access = await getDocumentAccess()
  if (!access?.session?.user) redirect("/login")
  if (!access.membership) redirect("/register")

  const [members, invitations] = await Promise.all([
    prisma.member.findMany({
      where: { organizationId: access.membership.organizationId },
      include: { user: { select: { name: true, email: true, image: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invitation.findMany({
      where: { organizationId: access.membership.organizationId, status: "pending" },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return (
    <TeamClient
      organizationId={access.membership.organizationId}
      canManage={access.canManage}
      members={members.map((member) => ({
        id: member.id,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
      }))}
      invitations={invitations.map((invitation) => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role || "member",
        createdAt: invitation.createdAt.toISOString(),
      }))}
    />
  )
}
