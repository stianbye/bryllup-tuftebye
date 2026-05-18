import { useState } from 'react'
import { useWeddingStore } from '@/store/wedding'
import TableCard from '@/components/shared/TableCard'
import Progress from '@/components/shared/Progress'
import VersionPill from '@/components/shared/VersionPill'
import type { Guest, Assignment } from '@/types/database'

export default function MobileTablesView() {
  const { state, selectedGuestId, setSelectedGuest } = useWeddingStore()
  const [filter, setFilter] = useState<'alle' | 'konflikt'>('alle')

  if (!state) return null
  const { wedding, tables, guests, assignments } = state

  const placedCount = assignments.length
  const totalCount = guests.length

  const onGuestClick = (guest: Guest, _assignment: Assignment) => {
    setSelectedGuest(selectedGuestId === guest.id ? null : guest.id)
  }

  return (
    <div className="flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border pt-safe">
        <div className="px-4 py-3">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <h1 className="font-serif text-lg leading-tight truncate">{wedding.name}</h1>
              <p className="text-[11px] text-muted-foreground">22. august 2026</p>
            </div>
            <VersionPill />
          </div>
          <Progress placed={placedCount} total={totalCount} />
        </div>

        {/* Filter-chips */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-thin">
          <FilterChip active={filter === 'alle'} onClick={() => setFilter('alle')}>
            Alle bord
          </FilterChip>
          <FilterChip
            active={filter === 'konflikt'}
            onClick={() => setFilter('konflikt')}
            highlight
          >
            Konflikter
          </FilterChip>
        </div>
      </div>

      {/* Tables list */}
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
        {tables.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            Ingen bord ennå — legg til under Innstillinger.
          </p>
        )}
      </div>
    </div>
  )
}

function FilterChip({
  children,
  active,
  highlight,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  highlight?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : highlight
          ? 'border-destructive/60 text-destructive'
          : 'border-border text-foreground bg-secondary/30'
      }`}
    >
      {children}
    </button>
  )
}
