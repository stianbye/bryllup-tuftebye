import { useDroppable } from '@dnd-kit/core'
import { AlertTriangle, Check, Edit3, Lock, Heart, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import GuestDot from '@/components/shared/GuestDot'
import { conflictsForTable, tableStatus } from '@/lib/conflicts'
import { useWeddingStore } from '@/store/wedding'
import type { Assignment, Guest, TableEntity } from '@/types/database'

interface Props {
  table: TableEntity
  guests: Guest[]
  assignments: Assignment[]
  onGuestClick?: (guest: Guest) => void
  onGuestEdit?: (guest: Guest) => void
}

export default function DesktopTableCard({
  table,
  guests,
  assignments,
  onGuestClick,
  onGuestEdit,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: `table-${table.id}` })
  const { selectedGuestId, assignGuest, toggleLock, unassign, deleteTable, updateTable } =
    useWeddingStore()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(table.name)
  const [capacity, setCapacity] = useState(table.capacity)

  const tableAssignments = assignments.filter((a) => a.table_id === table.id)
  const tableGuests = tableAssignments
    .map((a) => ({ assignment: a, guest: guests.find((g) => g.id === a.guest_id) }))
    .filter((x): x is { assignment: Assignment; guest: Guest } => !!x.guest)
    .sort((a, b) => a.guest.name.localeCompare(b.guest.name, 'no'))

  const status = tableStatus(table, guests, assignments)
  const conflicts = conflictsForTable(table, guests, assignments)
  const isFull = tableAssignments.length >= table.capacity

  // Hvis bruker har valgt en gjest og klikker dette bordet, plasser dem
  const handleCardClick = () => {
    if (selectedGuestId && !isFull) {
      assignGuest(selectedGuestId, table.id)
    }
  }

  return (
    <div
      ref={setNodeRef}
      onClick={selectedGuestId ? handleCardClick : undefined}
      className={cn(
        'rounded-lg border p-3 transition-all',
        status === 'error' && 'border-destructive/60 bg-destructive/10',
        status === 'warning' && 'border-amber-500/40 bg-amber-500/5',
        status === 'ok' && 'border-border bg-card',
        isOver && 'ring-2 ring-primary border-primary',
        selectedGuestId && !isFull && 'cursor-pointer hover:border-primary'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {status === 'error' && <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />}
          {status === 'warning' && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
          {status === 'ok' && isFull && <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />}
          {editing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={async () => {
                await updateTable(table.id, { name, capacity })
                setEditing(false)
              }}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  await updateTable(table.id, { name, capacity })
                  setEditing(false)
                }
              }}
              autoFocus
              className="bg-secondary border border-border rounded px-1.5 py-0.5 text-sm font-serif w-full"
            />
          ) : (
            <h3
              className="font-serif text-sm font-medium truncate cursor-pointer hover:text-primary"
              onClick={(e) => {
                e.stopPropagation()
                setEditing(true)
              }}
            >
              {table.name}
            </h3>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {editing && (
            <input
              type="number"
              min={1}
              max={20}
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
              className="w-12 bg-secondary border border-border rounded px-1 py-0.5 text-xs"
            />
          )}
          <span
            className={cn(
              'text-xs font-mono',
              isFull && status === 'ok' && 'text-emerald-400',
              status === 'error' && 'text-destructive',
              status === 'warning' && 'text-amber-500',
              !isFull && status === 'ok' && 'text-muted-foreground'
            )}
          >
            {tableAssignments.length}/{table.capacity}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (tableAssignments.length > 0) {
                if (!confirm(`${table.name} har ${tableAssignments.length} gjester. Slette uansett?`))
                  return
              }
              deleteTable(table.id)
            }}
            className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-colors"
            aria-label="Slett bord"
          >
            <Trash2 className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Konflikt-meldinger */}
      {conflicts.length > 0 && (
        <div className="mb-2 space-y-0.5">
          {conflicts.slice(0, 2).map((c, i) => (
            <p
              key={i}
              className={cn(
                'text-[10px] leading-tight',
                c.level === 'error' ? 'text-destructive' : 'text-amber-500'
              )}
            >
              {c.message}
            </p>
          ))}
        </div>
      )}

      {/* Gjester */}
      <div className="space-y-0.5">
        {tableGuests.map(({ guest, assignment }) => (
          <div key={guest.id} className="group/g flex items-center gap-1 py-0.5 px-1 rounded hover:bg-secondary/60">
            <GuestDot group={guest.group_tag} size={5} />
            <span className="text-xs truncate flex-1">{guest.name}</span>
            {guest.is_couple_member && <Heart className="h-2.5 w-2.5 text-primary flex-shrink-0" />}
            {assignment.is_locked && <Lock className="h-2.5 w-2.5 text-primary flex-shrink-0" />}
            <div className="opacity-0 group-hover/g:opacity-100 flex items-center gap-0.5 transition-opacity">
              {onGuestEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onGuestEdit(guest)
                  }}
                  className="text-muted-foreground hover:text-foreground p-0.5"
                  aria-label="Rediger"
                >
                  <Edit3 className="h-2.5 w-2.5" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleLock(assignment.id, !assignment.is_locked)
                }}
                className="text-muted-foreground hover:text-primary p-0.5"
                aria-label={assignment.is_locked ? 'Lås opp' : 'Lås'}
              >
                <Lock className="h-2.5 w-2.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  unassign(assignment.id)
                }}
                className="text-muted-foreground hover:text-destructive p-0.5"
                aria-label="Fjern"
              >
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>
        ))}
        {tableGuests.length === 0 && (
          <p className="text-[11px] text-muted-foreground italic px-1 py-1">
            {selectedGuestId ? 'Klikk for å plassere' : 'Slipp gjest her'}
          </p>
        )}
      </div>
    </div>
  )
}
