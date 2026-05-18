import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useWeddingStore } from '@/store/wedding'
import GuestRow from '@/components/shared/GuestRow'
import { groupLabel } from '@/lib/colors'

type Filter = 'alle' | 'uplassert' | 'plassert'

export default function MobileGuestsView() {
  const { state, selectedGuestId, setSelectedGuest } = useWeddingStore()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('alle')

  const placedIds = useMemo(
    () => new Set(state?.assignments.map((a) => a.guest_id)),
    [state?.assignments]
  )

  if (!state) return null

  const filtered = state.guests
    .filter((g) => {
      if (filter === 'uplassert' && placedIds.has(g.id)) return false
      if (filter === 'plassert' && !placedIds.has(g.id)) return false
      if (search) {
        return g.name.toLowerCase().includes(search.toLowerCase())
      }
      return true
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'no'))

  // Gruppér etter group_tag
  const byGroup: Record<string, typeof filtered> = {}
  for (const g of filtered) {
    const key = g.group_tag || 'annet'
    if (!byGroup[key]) byGroup[key] = []
    byGroup[key].push(g)
  }

  const tablesById = new Map(state.tables.map((t) => [t.id, t]))
  const assignmentByGuest = new Map(state.assignments.map((a) => [a.guest_id, a]))

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-20 bg-background border-b border-border pt-safe">
        <div className="px-4 py-3">
          <h1 className="font-serif text-lg mb-3">Gjester</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Søk gjest…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-secondary border border-border rounded-md pl-9 pr-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-thin">
            <Chip active={filter === 'alle'} onClick={() => setFilter('alle')}>
              Alle · {state.guests.length}
            </Chip>
            <Chip active={filter === 'uplassert'} onClick={() => setFilter('uplassert')}>
              Uplassert · {state.guests.length - placedIds.size}
            </Chip>
            <Chip active={filter === 'plassert'} onClick={() => setFilter('plassert')}>
              Plassert · {placedIds.size}
            </Chip>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-4">
        {Object.entries(byGroup).map(([groupKey, groupGuests]) => (
          <div key={groupKey}>
            <p className="eyebrow mb-1.5 px-1">{groupLabel(groupKey as never)}</p>
            <div className="space-y-1">
              {groupGuests.map((g) => {
                const assignment = assignmentByGuest.get(g.id)
                const table = assignment ? tablesById.get(assignment.table_id) : null
                return (
                  <div key={g.id} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <GuestRow
                        guest={g}
                        assignment={assignment}
                        selected={selectedGuestId === g.id}
                        onClick={() => setSelectedGuest(selectedGuestId === g.id ? null : g.id)}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {table ? table.name : '— ikke plassert'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12 text-sm">
            Ingen gjester matcher.
          </p>
        )}
      </div>
    </div>
  )
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border ${
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'border-border text-foreground bg-secondary/30'
      }`}
    >
      {children}
    </button>
  )
}
