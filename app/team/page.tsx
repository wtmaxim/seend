import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/topbar"
import { TeamClient } from "@/components/team/team-client"
import { getDocumentAccess } from "@/lib/document-access"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = { title: "Équipe · Seend", description: "Les membres de votre organisation." }

export default async function TeamPage() {
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
    <>
      <Sidebar
        organizationName={access.organization?.name}
        organizations={access.organizations}
        activeOrganizationId={access.membership.organizationId}
      />
      <TopBar userName={access.session.user.name || access.session.user.email} />
      <main className="ml-16 min-h-svh px-8 pb-16 pt-6">
        <div className="mx-auto max-w-6xl space-y-8">
          <div>
            <h1 className="font-serif text-3xl text-foreground">Équipe</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Les membres de {access.organization?.name}.
            </p>
          </div>

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
        </div>
      </main>
    </>
  )
}
