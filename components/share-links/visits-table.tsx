import { Eye } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"

type VisitItem = {
  id: string
  visitorName: string | null
  visitorEmail: string | null
  startedAt: string
  lastSeenAt: string
  activeSeconds: number
  linkLabel: string | null
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0s"
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes < 60) return `${minutes}min ${remainingSeconds}s`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}min`
}

function isOnline(lastSeenAt: string) {
  return Date.now() - new Date(lastSeenAt).getTime() < 30_000
}

export function VisitsTable({ visits }: { visits: VisitItem[] }) {
  const t = useTranslations("visits")
  const format = useFormatter()

  return (
    <div className="rounded-2xl border border-border p-5">
      <div className="mb-3 flex items-center gap-2 text-sm text-foreground/80">
        <Eye className="size-4" />
        <span>{t("title")}</span>
      </div>
      {visits.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="space-y-2">
          {visits.map((visit) => (
            <div key={visit.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">
                  {[visit.visitorName, visit.visitorEmail].filter(Boolean).join(" · ") || t("anonymous")}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {format.dateTime(new Date(visit.startedAt), { dateStyle: "short", timeStyle: "short" })}
                  {visit.linkLabel && ` · ${visit.linkLabel}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-xs">
                {isOnline(visit.lastSeenAt) && (
                  <span className="flex items-center gap-1 text-emerald-500">
                    <span className="size-1.5 rounded-none bg-emerald-500" />
                    {t("online")}
                  </span>
                )}
                <span className="text-muted-foreground">{formatDuration(visit.activeSeconds)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
