import { redirect } from "next/navigation"

import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/topbar"
import { SettingsNav } from "@/components/settings/settings-nav"
import { getDocumentAccess } from "@/lib/document-access"

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const access = await getDocumentAccess()
  if (!access?.session?.user) redirect("/login")
  if (!access.membership || !access.organization) redirect("/register")

  return (
    <>
      <Sidebar
        organizationName={access.organization.name}
        organizations={access.organizations}
        activeOrganizationId={access.membership.organizationId}
      />
      <TopBar userName={access.session.user.name || access.session.user.email} />
      <main className="ml-16 min-h-svh px-8 pb-16 pt-6">
        <div className="mx-auto max-w-6xl space-y-8">
          <div>
            <h1 className="font-serif text-3xl text-foreground">Paramètres</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {access.organization.name} · {access.membership.role}
            </p>
          </div>

          <SettingsNav />

          {children}
        </div>
      </main>
    </>
  )
}
