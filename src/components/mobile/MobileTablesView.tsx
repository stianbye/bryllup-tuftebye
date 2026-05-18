import { useState } from 'react'
import { LayoutGrid, CircleDot } from 'lucide-react'
import { useWeddingStore } from '@/store/wedding'
import TableCard from '@/components/shared/TableCard'
import RoundTable from '@/components/shared/RoundTable'
import Progress from '@/components/shared/Progress'
import VersionPill from '@/components/shared/VersionPill'
import InsightsHero from '@/components/shared/InsightsHero'
import { cn } from '@/lib/utils'
import type { Guest, Assignment } from '@/types/database'

type ViewMode = 'cards' | 'rooms'

export default function MobileTablesView() {
  const { state, selectedGuestId, setSelectedGuest } = useWeddingStore()
  const [view, setView] = useState<ViewMode>('cards')

  if (!state) return null
  const { wedding, tables, guests, assignments } = state
  const placedCount = assignments.length
  const totalCount = guests.length

  const onGuestClick = (guest: Guest, _assignment: Assignment) => {
    setSelectedGuest(selectedGuestId === guest.id ? null : guest.id)
  }

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-20 bg-background border-b border-border/40 pt-safe backdrop-blur-md">
        <div className="px-4 py-3">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <h1 className="font-serif text-lg leading-tight truncate text-foreground">{wedding.name}</h1>
              <p className="text-[11px] text-muted-foreground">22. august 2026</p>
            </div>
            <VersionPill />
          </div>
          <Progress placed={placedCount} total={totalCount} />
        </div>

        <div className="px-4 pb-3 flex items-center justify-between gap-2">
          <div className="flex bg-secondary/40 rounded-md p-0.5 border border-border/40">
            <button
              type="button"
              onClick={() => setView('cards')}
              className={cn(
                'px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-colors',
                view === 'cards' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'
              )}
            >
              <LayoutGrid className="h-3 w-3" /> Liste
            </button>
            <button
              type="button"
              onClick={() => setView('rooms')}
              className={cn(
                'px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-colors',
                view === 'rooms' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'
              )}
            >
              <CircleDot className="h-3 w-3" /> Bord-layout
            </button>
          </div>
        </div>
      </div>

      <InsightsHero layout="mobile" />

      {view === 'cards' ? (
        <div className="p-3 space-y-2">
          {tables.map((t) => (
            <TableCard
              key={t.id}
              table={t}
              guests={guests}
              assignments={assignments}
              selectedGuestId={selectedGuestId}
              onGuestClick={onGuestClick}
            />
          ))}
        </div>
      ) : (
        <div className="p-3 grid grid-cols-2 gap-3">
          {tables.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-border/40 bg-card/60 p-2 transition-transform active:scale-[0.98]"
              onClick={() => {
                if (selectedGuestId) {
                  useWeddingStore.getState().assignGuest(selectedGuestId, t.id)
                }
              }}
            >
              <RoundTable
                table={t}
                guests={guests}
                assignments={assignments}
                size={150}
                highlightGuestId={selectedGuestId}
                onSeatClick={(g) => g && setSelectedGuest(selectedGuestId === g.id ? null : g.id)}
              />
            </div>
          ))}
        </div>
      )}
      {tables.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          Ingen bord ennå — legg til under Innstillinger.
        </p>
      )}
    </div>
  )
}
