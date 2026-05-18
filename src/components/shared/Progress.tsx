interface Props {
  placed: number
  total: number
  className?: string
}

export default function Progress({ placed, total, className }: Props) {
  const pct = total > 0 ? Math.round((placed / total) * 100) : 0
  return (
    <div className={className}>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {placed} av {total} plassert
      </div>
    </div>
  )
}
