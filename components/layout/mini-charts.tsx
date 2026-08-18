export function MiniBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1)
  return (
    <div className="flex h-12 items-end gap-1.5">
      {values.map((value, index) => (
        <div
          key={index}
          className="w-2.5 rounded-none bg-foreground/60"
          style={{ height: `${Math.max(10, (value / max) * 100)}%` }}
        />
      ))}
    </div>
  )
}

export function MiniSparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const points = values
    .map((value, index) => `${(index / Math.max(1, values.length - 1)) * 100},${100 - ((value - min) / range) * 100}`)
    .join(" ")

  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-12 w-full">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="text-foreground/70"
      />
    </svg>
  )
}
