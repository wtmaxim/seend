import { FileText } from "lucide-react"

export function PageTimeChart({ secondsByPage }: { secondsByPage: Map<number, number> }) {
  if (secondsByPage.size === 0) return null

  const pageCount = Math.max(...secondsByPage.keys())
  const values = Array.from({ length: pageCount }, (_, index) => secondsByPage.get(index + 1) ?? 0)
  const max = Math.max(...values, 1)

  return (
    <div className="rounded-2xl border border-border p-5">
      <div className="mb-4 flex items-center gap-2 text-sm text-foreground/80">
        <FileText className="size-4" />
        <span>Temps passé par page</span>
      </div>
      <div className="flex h-24 items-end gap-1">
        {values.map((seconds, index) => (
          <div
            key={index}
            title={`Page ${index + 1} — ${seconds}s`}
            className="flex-1 rounded-t bg-foreground/60"
            style={{ height: `${Math.max(4, (seconds / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>Page 1</span>
        <span>Page {pageCount}</span>
      </div>
    </div>
  )
}
