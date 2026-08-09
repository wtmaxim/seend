"use client"

import { BarChart3 } from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/utils"

const RANGES = [7, 30] as const
type Range = (typeof RANGES)[number]

export function VisitsChart({ dailyCounts }: { dailyCounts: number[] }) {
  const [range, setRange] = useState<Range>(7)
  const values = dailyCounts.slice(dailyCounts.length - range)
  const max = Math.max(...values, 1)
  const total = values.reduce((sum, value) => sum + value, 0)

  return (
    <div className="rounded-2xl border border-border p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-foreground/80">
          <BarChart3 className="size-4" />
          <span>Visites par jour</span>
        </div>
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
              {option}j
            </button>
          ))}
        </div>
      </div>

      <div className="flex h-24 items-end gap-1">
        {values.map((value, index) => (
          <div
            key={index}
            title={`${value} visite${value !== 1 ? "s" : ""}`}
            className="flex-1 rounded-t bg-foreground/60"
            style={{ height: `${Math.max(4, (value / max) * 100)}%` }}
          />
        ))}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {total} visite{total !== 1 ? "s" : ""} sur les {range} derniers jours
      </p>
    </div>
  )
}
