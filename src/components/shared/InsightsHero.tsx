import { AlertTriangle, Heart, Sparkles, Users, Clock, Coffee } from 'lucide-react'
import { useWeddingStore } from '@/store/wedding'
import { generateInsights, type Insight, type InsightKind } from '@/lib/insights'

function IconFor({ kind }: { kind: InsightKind }) {
  switch (kind) {
    case 'conflict':
      return <AlertTriangle className="h-4 w-4 text-destructive" />
    case 'couple-split':
      return <Heart className="h-4 w-4 text-amber-400" />
    case 'group-imbalance':
      return <Users className="h-4 w-4 text-amber-400" />
    case 'celebration':
      return <Sparkles className="h-4 w-4 text-primary" />
    case 'days-left':
      return <Clock className="h-4 w-4 text-primary" />
    case 'empty-table':
      return <Coffee className="h-4 w-4 text-muted-foreground" />
    default:
      return <Sparkles className="h-4 w-4 text-primary" />
  }
}

interface Props {
  layout?: 'mobile' | 'desktop'
}

export default function InsightsHero({ layout = 'mobile' }: Props) {
  const { state } = useWeddingStore()
  if (!state) return null
  const items = generateInsights(state.guests, state.tables, state.assignments, state.wedding.event_date)
  if (items.length === 0) return null

  if (layout === 'desktop') {
    return (
      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2">
        {items.map((i) => (
          <InsightChip key={i.id} insight={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="px-4 py-3 space-y-1.5">
      {items.slice(0, 3).map((i) => (
        <InsightCard key={i.id} insight={i} />
      ))}
    </div>
  )
}

function InsightCard({ insight }: { insight: Insight }) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-card border border-border/40 animate-fade-in">
      <div className="mt-0.5 flex-shrink-0">
        <IconFor kind={insight.kind} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-tight">{insight.title}</p>
        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{insight.detail}</p>
      </div>
    </div>
  )
}

function InsightChip({ insight }: { insight: Insight }) {
  return (
    <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border/40 max-w-xs animate-fade-in">
      <IconFor kind={insight.kind} />
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{insight.title}</p>
        <p className="text-[10px] text-muted-foreground truncate">{insight.detail}</p>
      </div>
    </div>
  )
}
