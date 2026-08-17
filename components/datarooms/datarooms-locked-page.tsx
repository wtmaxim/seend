import { FolderOpen } from "lucide-react"

import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/topbar"
import { DataroomsPaywall } from "@/components/datarooms/datarooms-paywall"

// Rendered instead of any dataroom page when the plan doesn't include
// datarooms. No dataroom is ever queried or sent to the client here — the
// paywall is the whole page, not an overlay on top of real content.
export function DataroomsLockedPage({
  userName,
  organizationName,
  organizations,
  activeOrganizationId,
  isOwner,
}: {
  userName: string
  organizationName?: string
  organizations: { id: string; name: string }[]
  activeOrganizationId: string
  isOwner: boolean
}) {
  return (
    <>
      <Sidebar
        organizationName={organizationName}
        organizations={organizations}
        activeOrganizationId={activeOrganizationId}
      />
      <TopBar userName={userName} />
      <main className="ml-16 min-h-svh px-8 pb-16 pt-6">
        <div className="mx-auto max-w-6xl space-y-8">
          <header>
            <h1 className="font-serif text-3xl text-foreground">Datarooms</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Regroupez vos documents pour {organizationName}.
            </p>
          </header>
          <div className="rounded-2xl border border-border p-10 text-center">
            <FolderOpen className="mx-auto mb-3 size-7 text-muted-foreground" />
            <p className="text-sm font-medium">Aucune dataroom pour le moment</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Regroupez vos documents pour préparer vos échanges.
            </p>
          </div>
        </div>
      </main>
      <DataroomsPaywall isOwner={isOwner} />
    </>
  )
}
