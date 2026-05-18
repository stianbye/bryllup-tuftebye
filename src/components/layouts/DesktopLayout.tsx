import { useState } from 'react'
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  Search, Heart, Wand2, Printer, Plus, AlertCircle, RotateCcw, X,
  LayoutGrid, CircleDot,
} from 'lucide-react'
import { useWeddingStore } from '@/store/wedding'
import { Button } from '@/components/ui/button'
import Progress from '@/components/shared/Progress'
import VersionPill from '@/components/shared/VersionPill'
import GuestDot from '@/components/shared/GuestDot'
import DesktopTableCard from '@/components/desktop/DesktopTableCard'
import DraggableGuest from '@/components/desktop/DraggableGuest'
import GuestEditSheet from '@/components/mobile/GuestEditSheet'
import RoundTable from '@/components/shared/RoundTable'
import InsightsHero from '@/components/shared/InsightsHero'
import { detectAllConflicts } from '@/lib/conflicts'
import { autoPlace } from '@/lib/auto-place'
import { groupLabel } from '@/lib/colors'
import { cn } from '@/lib/utils'
import type { Guest } from '@/types/database'

type ViewMode = 'cards' | 'rooms'

export default function DesktopLayout() {
  const {
    state,
    assignGuest,
    selectedGuestId,
    setSelectedGuest,
    addTable,
    bulkAssign,
    resetAssignments,
  } = useWeddingStore()
  const [search, setSearch] = useState('')
  const [view, setView] = useState<ViewMode>('cards')
  const [draggingGuest, setDraggingGuest] = useState<Guest | null>(null)
  const [editGuest, setEditGuest] = useState<Guest | null>(null)
  const [autoBusy, setAutoBusy] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  if (!state) return null
  const { wedding, tables, guests, assignments, active_version } = state

  const placedIds = new Set(assignments.map((a) => a.guest_id))
  const unplaced = guests
    .filter((g) => !placedIds.has(g.id))
    .filter((g) => !search || g.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'no'))

  const conflicts = detectAllConflicts(tables, guests, assignments)

  const handleDragStart = (e: DragStartEvent) => {
    const guest = guests.find((g) => g.id === e.active.id)
    if (guest) setDraggingGuest(guest)
  }

  const handleDragEnd = (e: DragEndEvent) => {
    setDraggingGuest(null)
    if (!e.over) return
    const guestId = e.active.id as string
    const tableId = e.over.id as string
    const guest = guests.find((g) => g.id === guestId)
    if (!guest || !tableId.startsWith('table-')) return
    const realTableId = tableId.replace('table-', '')
    assignGuest(guestId, realTableId).then(() => {
      if (guest.partner_of) {
        const partner = guests.find((g) => g.id === guest.partner_of)
        const partnerAssign = assignments.find((a) => a.guest_id === partner?.id)
        if (partner && (!partnerAssign || partnerAssign.table_id !== realTableId)) {
          if (confirm(`Også flytte ${partner.name} til ${tables.find((t) => t.id === realTableId)?.name}?`)) {
            assignGuest(partner.id, realTableId)
          }
        }
      }
    })
  }

  const handleAutoPlace = async () => {
    const placed = assignments.length
    const total = guests.length
    if (!confirm(`Auto-plassere ${total - placed} uplasserte gjester?`)) return
    setAutoBusy(true)
    const result = autoPlace(tables, guests, assignments)
    const allAssignments = [
      ...assignments.map((a) => ({ guest_id: a.guest_id, table_id: a.table_id })),
      ...result,
    ]
    await bulkAssign(active_version.id, allAssignments)
    setAutoBusy(false)
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border/40 bg-popover/70 backdrop-blur-md">
          <div className="px-6 py-3 flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Heart className="h-5 w-5 text-primary fill-current" />
              <div>
                <h1 className="font-serif text-base leading-tight text-foreground">{wedding.name}</h1>
                <p className="text-[11px] text-muted-foreground">22. august 2026</p>
              </div>
              <div className="h-8 w-px bg-border/40" />
              <Progress placed={assignments.length} total={guests.length} className="w-44" />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-secondary/40 rounded-md p-0.5 border border-border/40">
                <button
                  type="button"
                  onClick={() => setView('cards')}
                  className={cn('px-2 py-1 rounded text-xs flex items-center gap-1', view === 'cards' ? 'bg-primary/20 text-primary' : 'text-muted-foreground')}
                >
                  <LayoutGrid className="h-3 w-3" /> Liste
                </button>
                <button
                  type="button"
                  onClick={() => setView('rooms')}
                  className={cn('px-2 py-1 rounded text-xs flex items-center gap-1', view === 'rooms' ? 'bg-primary/20 text-primary' : 'text-muted-foreground')}
                >
                  <CircleDot className="h-3 w-3" /> Bord-layout
                </button>
              </div>
              <VersionPill />
              <Button size="sm" variant="outline" onClick={handleAutoPlace} disabled={autoBusy}>
                <Wand2 className="mr-2 h-3.5 w-3.5" /> Auto-forslag
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.open('/print', '_blank')}>
                <Printer className="mr-2 h-3.5 w-3.5" /> Print
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (confirm('Nullstille ikke-låste plasseringer?')) resetAssignments(active_version.id)
                }}
              >
                <RotateCcw className="mr-2 h-3.5 w-3.5" /> Nullstill
              </Button>
            </div>
          </div>
          <div className="px-6 pb-3">
            <InsightsHero layout="desktop" />
          </div>
        </header>

        <div className="flex-1 grid grid-cols-[260px_1fr] overflow-hidden">
          <aside className="border-r border-border/40 bg-popover/30 overflow-y-auto scrollbar-thin">
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Søk gjest…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-secondary/60 border border-border/40 rounded-md pl-9 pr-3 py-1.5 text-sm"
                />
              </div>
              <p className="eyebrow">Uplassert · {unplaced.length}</p>
              <div className="space-y-1.5">
                {unplaced.map((g) => (
                  <DraggableGuest
                    key={g.id}
                    guest={g}
                    selected={selectedGuestId === g.id}
                    onClick={() => setSelectedGuest(selectedGuestId === g.id ? null : g.id)}
                    onEdit={() => setEditGuest(g)}
                  />
                ))}
                {unplaced.length === 0 && (
                  <p className="text-xs text-muted-foreground italic py-2">Alle plassert.</p>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-border/40">
                <p className="eyebrow mb-2">Fargekode</p>
                <ul className="space-y-1 text-[11px] text-muted-foreground">
                  {['brudepar', 'familie_stian', 'familie_laila', 'venner_stian', 'venner_laila'].map((t) => (
                    <li key={t} className="flex items-center gap-2">
                      <GuestDot group={t as never} size={6} />
                      {groupLabel(t as never)}
                    </li>
                  ))}
                </ul>
              </div>

              {conflicts.length > 0 && (
                <div className="pt-3 mt-3 border-t border-border/40">
                  <p className="eyebrow text-destructive mb-2">Konflikter · {conflicts.length}</p>
                  <ul className="space-y-1.5">
                    {conflicts.slice(0, 5).map((c, i) => (
                      <li
                        key={i}
                        className={`text-[11px] flex items-start gap-1.5 ${c.level === 'error' ? 'text-destructive' : 'text-amber-500'}`}
                      >
                        <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{c.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>

          <main className="overflow-y-auto scrollbar-thin">
            <div className="p-6">
              {view === 'cards' ? (
                <div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
                  {tables.map((t) => (
                    <DesktopTableCard
                      key={t.id}
                      table={t}
                      guests={guests}
                      assignments={assignments}
                      onGuestClick={(g) => setSelectedGuest(selectedGuestId === g.id ? null : g.id)}
                      onGuestEdit={(g) => setEditGuest(g)}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => addTable()}
                    className="rounded-lg border-2 border-dashed border-border/40 text-muted-foreground p-4 flex flex-col items-center justify-center gap-1 hover:border-primary/60 hover:text-primary transition-colors min-h-[120px]"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-xs">Legg til bord</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 xl:grid-cols-4 gap-6">
                  {tables.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        if (selectedGuestId) assignGuest(selectedGuestId, t.id)
                      }}
                      className="rounded-xl border border-border/40 bg-card/60 p-3 flex items-center justify-center cursor-pointer hover:border-primary/40 transition-colors"
                    >
                      <RoundTable
                        table={t}
                        guests={guests}
                        assignments={assignments}
                        size={220}
                        highlightGuestId={selectedGuestId}
                        onSeatClick={(g) =>
                          g && setSelectedGuest(selectedGuestId === g.id ? null : g.id)
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>

        {selectedGuestId && !draggingGuest && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-popover/95 backdrop-blur-md border border-primary/60 rounded-full shadow-lg px-4 py-2 flex items-center gap-3 z-30 animate-slide-up">
            {(() => {
              const g = guests.find((x) => x.id === selectedGuestId)
              if (!g) return null
              return (
                <>
                  <GuestDot group={g.group_tag} size={8} />
                  <span className="text-sm font-medium text-foreground">{g.name}</span>
                  <span className="text-xs text-muted-foreground">Klikk et bord for å flytte</span>
                  <button
                    onClick={() => setSelectedGuest(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              )
            })()}
          </div>
        )}
      </div>

      <DragOverlay>
        {draggingGuest && (
          <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium shadow-lg flex items-center gap-2">
            <GuestDot group={draggingGuest.group_tag} size={6} />
            {draggingGuest.name}
          </div>
        )}
      </DragOverlay>

      {editGuest && (
        <GuestEditSheet
          guest={editGuest}
          open={true}
          onOpenChange={(open) => !open && setEditGuest(null)}
        />
      )}
    </DndContext>
  )
}
