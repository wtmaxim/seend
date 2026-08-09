import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { DocumentsClient } from "@/components/documents/documents-client"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/topbar"
import { getDocumentAccess, serializeDocument } from "@/lib/document-access"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = { title: "Documents · Seend", description: "Votre bibliothèque de documents." }

export default async function DocumentsPage() {
  const access = await getDocumentAccess()
  if (!access?.session?.user) redirect("/login")
  if (!access.membership) redirect("/register")
  const documents = await prisma.document.findMany({ where: { organizationId: access.membership.organizationId }, include: { uploadedBy: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" } })

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
          <header className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl text-foreground">Documents</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                La bibliothèque privée de {access.organization?.name}.
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>{access.membership.role}</p>
              <p>{documents.length} document{documents.length === 1 ? "" : "s"}</p>
            </div>
          </header>
          <DocumentsClient documents={documents.map(serializeDocument)} canManage={access.canManage} organizationId={access.membership.organizationId} />
        </div>
      </main>
    </>
  )
}
