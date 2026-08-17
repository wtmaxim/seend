"use client"

import {
  Activity,
  ArrowUp,
  FileStack,
  FileText,
  FolderOpen,
  HardDrive,
  Settings,
  TrendingUp,
  UploadCloud,
  UserPlus,
  Users,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { DashboardCard } from "@/components/layout/dashboard-card"
import { MiniBars, MiniSparkline } from "@/components/layout/mini-charts"
import { cn } from "@/lib/utils"

const STORAGE_LIMIT = 50 * 1024 * 1024 * 1024

function formatBytes(bytes: number) {
  if (bytes <= 0) return "0 Ko"
  const units = ["o", "Ko", "Mo", "Go"]
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${(bytes / Math.pow(1024, exponent)).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

const promptSuggestions = [
  "trouver un document ajouté cette semaine",
  "voir qui a ajouté le plus de documents",
  "savoir combien d'espace il me reste",
]

function AssistantBox() {
  const [value, setValue] = useState("")
  const router = useRouter()

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {promptSuggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => setValue(`Je veux ${suggestion}`)}
            className="rounded-lg border border-border px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <span className="text-foreground/50">Je veux </span>
            {suggestion}
          </button>
        ))}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          router.push("/documents")
        }}
        className="flex items-center gap-3 rounded-xl border border-border bg-white/[0.02] px-4 py-3"
      >
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Je veux..."
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90"
        >
          <ArrowUp className="size-4" />
        </button>
      </form>
    </div>
  )
}

const quickActions = [
  { icon: UploadCloud, label: "Ajouter des documents", href: "/documents" },
  { icon: FolderOpen, label: "Nouvelle dataroom", href: "/datarooms" },
  { icon: UserPlus, label: "Inviter un membre", href: "/settings/team" },
  { icon: Settings, label: "Paramètres", href: "/settings" },
]

export function DashboardClient({
  userName,
  organizationName,
  documentCount,
  documentsThisWeek,
  sizeThisWeek,
  totalSize,
  teamMembers,
  biggestDocument,
  activityCounts,
}: {
  userName: string
  organizationName: string
  documentCount: number
  documentsThisWeek: number
  sizeThisWeek: number
  totalSize: number
  teamMembers: number
  biggestDocument: { originalName: string; size: number } | null
  activityCounts: number[]
}) {
  const [tab, setTab] = useState<"overview" | "metrics">("overview")
  const [summaryDismissed, setSummaryDismissed] = useState(false)
  const percentUsed = Math.min(100, Math.round((totalSize / STORAGE_LIMIT) * 100))

  return (
    <main className="ml-16 min-h-svh px-8 pb-16 pt-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl text-foreground">
              Bonjour <span className="text-muted-foreground">{userName}</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Voici un rapide aperçu de votre espace de travail.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
              Tout l&apos;historique
            </span>
            <div className="flex rounded-lg border border-border p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setTab("overview")}
                className={cn(
                  "rounded-md px-3 py-1.5 transition-colors",
                  tab === "overview" ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setTab("metrics")}
                className={cn(
                  "rounded-md px-3 py-1.5 transition-colors",
                  tab === "metrics" ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Metrics
              </button>
            </div>
          </div>
        </div>

        {tab === "metrics" ? (
          <DashboardCard label="Métriques">
            <p>Les métriques avancées arrivent bientôt.</p>
          </DashboardCard>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {!summaryDismissed && (
                <DashboardCard
                  icon={<Activity className="size-4" />}
                  label="Résumé de la semaine"
                  timestamp="À l'instant"
                  highlighted
                  footerLeft={
                    <Link href="/documents" className="hover:text-foreground">
                      Voir le détail
                    </Link>
                  }
                  footerRight={
                    <button type="button" onClick={() => setSummaryDismissed(true)} className="hover:text-foreground">
                      Ignorer
                    </button>
                  }
                >
                  <span className="font-medium text-foreground">{documentsThisWeek}</span> document
                  {documentsThisWeek !== 1 ? "s" : ""} ajouté{documentsThisWeek !== 1 ? "s" : ""},{" "}
                  <span className="font-medium text-foreground">{formatBytes(sizeThisWeek)}</span> envoyés cette
                  semaine.
                </DashboardCard>
              )}

              <DashboardCard
                icon={<TrendingUp className="size-4" />}
                label="Activité"
                footerLeft={
                  <Link href="/documents" className="hover:text-foreground">
                    Voir l&apos;historique complet
                  </Link>
                }
              >
                <p className="mb-3">Vos ajouts sur les 7 derniers jours.</p>
                <MiniBars values={activityCounts} />
              </DashboardCard>

              <DashboardCard
                icon={<HardDrive className="size-4" />}
                label="Stockage & capacité"
                footerLeft={
                  <Link href="/documents" className="hover:text-foreground">
                    Voir le stockage
                  </Link>
                }
              >
                <p className="mb-2">
                  Vous utilisez <span className="font-medium text-foreground">{formatBytes(totalSize)}</span> sur 50
                  Go.
                </p>
                <div className="text-3xl font-semibold text-foreground">{percentUsed}%</div>
              </DashboardCard>

              <DashboardCard
                icon={<FileText className="size-4" />}
                label="Fichiers"
                footerLeft={
                  <Link href="/documents" className="hover:text-foreground">
                    Afficher les documents
                  </Link>
                }
              >
                <span className="font-medium text-foreground">{documentsThisWeek}</span> nouveau
                {documentsThisWeek !== 1 ? "x" : ""} document{documentsThisWeek !== 1 ? "s" : ""} ajouté
                {documentsThisWeek !== 1 ? "s" : ""} récemment.
              </DashboardCard>

              <DashboardCard
                icon={<HardDrive className="size-4" />}
                label="Espace utilisé"
                footerLeft={
                  biggestDocument ? (
                    <span className="truncate">Plus gros fichier : {biggestDocument.originalName}</span>
                  ) : (
                    "Aucun fichier"
                  )
                }
              >
                <p className="mb-2">Stockage total</p>
                <div className="text-3xl font-semibold text-foreground">{formatBytes(totalSize)}</div>
              </DashboardCard>

              <DashboardCard
                icon={<FileStack className="size-4" />}
                label="Documents"
                footerLeft={
                  <Link href="/documents" className="hover:text-foreground">
                    Voir tous les documents
                  </Link>
                }
              >
                Vous avez actuellement{" "}
                <span className="font-medium text-foreground">{documentCount}</span> document
                {documentCount !== 1 ? "s" : ""} dans votre espace.
              </DashboardCard>

              <DashboardCard
                icon={
                  <span className="flex size-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium text-foreground">
                    {organizationName.slice(0, 1).toUpperCase()}
                  </span>
                }
                label="Organisation"
                footerLeft={
                  <Link href="/settings/team" className="hover:text-foreground">
                    Voir l&apos;équipe
                  </Link>
                }
              >
                <span className="font-medium text-foreground">{organizationName}</span> compte{" "}
                <span className="font-medium text-foreground">{teamMembers}</span> membre
                {teamMembers !== 1 ? "s" : ""}.
              </DashboardCard>

              <DashboardCard
                icon={<Users className="size-4" />}
                label="Activité récente"
                footerLeft={
                  <Link href="/documents" className="hover:text-foreground">
                    Voir l&apos;historique
                  </Link>
                }
              >
                <p className="mb-3">Évolution des ajouts sur 7 jours.</p>
                <MiniSparkline values={activityCounts} />
              </DashboardCard>
            </div>

            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground/80 transition-colors hover:bg-white/5 hover:text-foreground"
                >
                  <action.icon className="size-4" />
                  {action.label}
                </Link>
              ))}
            </div>

            <AssistantBox />
          </>
        )}
      </div>
    </main>
  )
}
