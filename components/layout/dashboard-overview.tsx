"use client"

import { Link2 } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { useState } from "react"

import type { DashboardData } from "@/lib/dashboard-analytics"
import { cn } from "@/lib/utils"

const RANGES = [7, 30] as const
type Range = (typeof RANGES)[number]

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <span className="flex size-9 items-center justify-center rounded-full bg-white/5 text-muted-foreground">
        <Link2 className="size-4" />
      </span>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function Table({
  columns,
  rows,
  emptyLabel,
}: {
  columns: string[]
  rows: (string | number)[][]
  emptyLabel: string
}) {
  if (rows.length === 0) return <EmptyState label={emptyLabel} />

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            {columns.map((column) => (
              <th key={column} className="whitespace-nowrap py-2 pr-4 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-border">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={cn(
                    "whitespace-nowrap py-2.5 pr-4",
                    cellIndex === 0 ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DashboardOverview({ data }: { data: DashboardData }) {
  const t = useTranslations("dashboard")
  const format = useFormatter()
  const [range, setRange] = useState<Range>(7)
  const [tab, setTab] = useState<"links" | "documents" | "visitors" | "recent">("links")

  // Elapsed reading time, not a date — so it's built from unit messages the
  // catalogue owns rather than from Intl's relative-time wording ("3 minutes
  // ago"), which would say the wrong thing entirely.
  function duration(seconds: number) {
    if (!Number.isFinite(seconds) || seconds <= 0) return "—"
    if (seconds < 60) return t("duration.seconds", { seconds })
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return t("duration.minutes", { minutes, seconds: seconds % 60 })
    return t("duration.hours", { hours: Math.floor(minutes / 60), minutes: minutes % 60 })
  }

  function when(iso: string | null) {
    if (!iso) return "—"
    return format.dateTime(new Date(iso), { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
  }

  const values = data.dailyCounts.slice(data.dailyCounts.length - range)
  const max = Math.max(...values, 1)
  const dayLabels = Array.from({ length: range }, (_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (range - 1 - index))
    return format.dateTime(date, { weekday: "short", day: "numeric", month: "short" })
  })

  const tabs = [
    { key: "links" as const, label: t("tabs.links"), count: data.links.length },
    { key: "documents" as const, label: t("tabs.documents"), count: data.documents.length },
    { key: "visitors" as const, label: t("tabs.visitors"), count: data.visitors.length },
    { key: "recent" as const, label: t("tabs.recent"), count: data.recentViews.length },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border p-5">
        <div className="mb-6 flex items-center justify-between gap-2">
          <span className="text-sm text-foreground/80">{t("viewsOverview")}</span>
          <div className="flex rounded-lg border border-border p-0.5 text-xs">
            {RANGES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRange(option)}
                className={cn(
                  "rounded-md px-3 py-1.5 transition-colors",
                  range === option ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t("rangeDays", { days: option })}
              </button>
            ))}
          </div>
        </div>

        <div className="flex h-32 items-end gap-1">
          {values.map((value, index) => (
            <div
              key={index}
              title={t("dayTooltip", { label: dayLabels[index], count: value })}
              className="flex-1 rounded-t bg-foreground/60 transition-colors hover:bg-foreground/80"
              style={{ height: `${Math.max(3, (value / max) * 100)}%` }}
            />
          ))}
        </div>
        {range === 7 && (
          <div className="mt-2 flex gap-1 text-[10px] text-muted-foreground">
            {dayLabels.map((label, index) => (
              <span key={index} className="flex-1 truncate text-center">
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border p-5">
        <div className="mb-4 flex flex-wrap items-center gap-1 border-b border-border pb-3">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors",
                tab === item.key ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {item.count}
              </span>
            </button>
          ))}
        </div>

        {tab === "links" && (
          <Table
            columns={[t("columns.link"), t("columns.views"), t("columns.avgDuration"), t("columns.lastView")]}
            rows={data.links.map((link) => [link.label, link.views, duration(link.avgSeconds), when(link.lastViewedAt)])}
            emptyLabel={t("empty.links")}
          />
        )}
        {tab === "documents" && (
          <Table
            columns={[t("columns.document"), t("columns.views"), t("columns.avgDuration"), t("columns.lastView")]}
            rows={data.documents
              .filter((document) => document.views > 0)
              .map((document) => [document.name, document.views, duration(document.avgSeconds), when(document.lastViewedAt)])}
            emptyLabel={t("empty.documents")}
          />
        )}
        {tab === "visitors" && (
          <Table
            columns={[t("columns.visitor"), t("columns.views"), t("columns.avgDuration"), t("columns.lastView")]}
            rows={data.visitors.map((visitor) => [
              visitor.name || visitor.email || t("anonymousVisitor"),
              visitor.views,
              duration(visitor.avgSeconds),
              when(visitor.lastViewedAt),
            ])}
            emptyLabel={t("empty.visitors")}
          />
        )}
        {tab === "recent" && (
          <Table
            columns={[t("columns.visitor"), t("columns.target"), t("columns.duration"), t("columns.when")]}
            rows={data.recentViews.map((view) => [
              view.visitorLabel,
              view.targetName,
              duration(view.seconds),
              when(view.startedAt),
            ])}
            emptyLabel={t("empty.recent")}
          />
        )}
      </div>
    </div>
  )
}

export function DashboardHeader({ userName }: { userName: string }) {
  const t = useTranslations("dashboard")
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.rich("greeting", {
            highlight: (chunks) => <span className="text-foreground/80">{chunks}</span>,
            name: userName,
          })}
        </p>
      </div>
    </div>
  )
}
