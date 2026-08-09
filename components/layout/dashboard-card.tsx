import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function DashboardCard({
  icon,
  label,
  timestamp,
  highlighted,
  children,
  footerLeft,
  footerRight,
  className,
}: {
  icon?: ReactNode
  label?: string
  timestamp?: string
  highlighted?: boolean
  children?: ReactNode
  footerLeft?: ReactNode
  footerRight?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex min-h-[13rem] flex-col justify-between rounded-2xl border border-border p-5",
        highlighted ? "bg-white/[0.06]" : "bg-white/[0.02]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-foreground/80">
          {icon}
          {label && <span>{label}</span>}
        </div>
        {timestamp && <span className="text-xs text-muted-foreground">{timestamp}</span>}
      </div>

      <div className="flex-1 py-4 text-sm leading-relaxed text-muted-foreground">{children}</div>

      {(footerLeft || footerRight) && (
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{footerLeft}</span>
          <span>{footerRight}</span>
        </div>
      )}
    </div>
  )
}
