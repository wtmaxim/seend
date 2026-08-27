import { redirect } from "next/navigation"

import { DashboardHeader, DashboardOverview } from "@/components/layout/dashboard-overview"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/topbar"
import { getDashboardData } from "@/lib/dashboard-analytics"
import { getDocumentAccess } from "@/lib/document-access"

export default async function Page() {
  const access = await getDocumentAccess()
  if (!access) redirect("/login")
  if (!access.membership) redirect("/register")

  const organizationId = access.membership.organizationId
  const userName = access.session.user.name || access.session.user.email

  const data = await getDashboardData(organizationId)

  return (
    <>
      <Sidebar
        organizationName={access.organization?.name}
        organizations={access.organizations}
        activeOrganizationId={organizationId}
      />
      <TopBar userName={userName} />
      <main className="ml-16 min-h-svh px-8 pb-16 pt-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <DashboardHeader userName={userName} />
          <DashboardOverview data={data} />
        </div>
      </main>
    </>
  )
}
