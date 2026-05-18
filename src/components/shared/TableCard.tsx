import { AlertTriangle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Assignment, Guest, TableEntity } from '@/types/database'
import { conflictsForTable, tableStatus } from '@/lib/conflicts'
import GuestRow from './GuestRow'

interface Props {
  table: TableEntity
  guests: Guest[]
  assignments: Assignment[]
  selectedGuestId?: string | null
  onGuestClick?: (guest: Guest, assignment: Assignment) => void
  onTableClick?: (table: TableEntity) => void
  compact?: boolean
  maxGuestsShown?: number
}

export default function TableCard({
  table,
  guests,
  assignments,
  selectedGuestId,
  onGuestClick,
  onTableClick,
  compact = false,
  maxGuestsShown = 99,
}: Props) {
  const tableAssignments = assignments.filter((a) => a.table_id === table.id)
  const tableGuests = tableAssignments
    .map((a) => ({ assignment: a, guest: guests.find((g) => g.id === a.guest_id) }))
    .filter((x): x is { assignment: Assignment; guest: Guest } => !!x.guest)
    .sort((a, b) => a.guest.name.localeCompare(b.guest.name, 'no'))

  const status = tableStatus(table, guests, assignments)
  const conflicts = conflictsForTable(table, guests, assignments)
  const isFull = tableAssignments.length >= table.capacity

  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-all',
        status === 'error' && 'border-destructive/60 bg-destructive/10',
        status === 'warning' && 'border-amber-500/40 bg-amber-500/5',
        status === 'ok' && 'border-border bg-card',
        onTableClick && 'cursor-pointer hover:border-primary/40'
      )}
      onClick={onTableClick ? () => onTableClick(table) : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {status === 'error' && (
            <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
          )}
          {status === 'warning' && (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
          )}
          {status === 'ok' && isFull && (
            <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
          )}
          <h3 className="font-serif text-sm font-medium truncate text-foreground">{table.name}</h3>
        </div>
        <span
          className={cn(
            'text-xs font-mono flex-shrink-0',
            isFull && status === 'ok' && 'text-emerald-400',
            status === 'error' && 'text-destructive',
            status === 'warning' && 'text-amber-500',
            !isFull && status === 'ok' && 'text-muted-foreground'
          )}
        >
          {tableAssignments.length}/{table.capacity}
        </span>
      </div>

      {/* Konflikt-meldinger inline */}
      {conflicts.length > 0 && (
        <div className="mb-2 space-y-0.5">
          {conflicts.slice(0, 2).map((c, i) => (
            <p
              key={i}
              className={cn(
                'text-[11px] leading-tight',
                c.level === 'error' ? 'text-destructive' : 'text-amber-500'
              )}
            >
              {c.message}
            </p>
          ))}
          {conflicts.length > 2 && (
            <p className="text-[11px] text-muted-foreground">+ {conflicts.length - 2} flere</p>
          )}
        </div>
      )}

      {/* Gjeste-liste */}
      <div className="space-y-1">
        {tableGuests.slice(0, maxGuestsShown).map(({ guest, assignment }) => (
          <GuestRow
            key={guest.id}
            guest={guest}
            assignment={assignment}
            selected={selectedGuestId === guest.id}
            onClick={onGuestClick ? () => onGuestClick(guest, assignment) : undefined}
            compact={compact}
          />
        ))}
        {tableGuests.length > maxGuestsShown && (
          <p className="text-xs text-muted-foreground px-1.5">
            + {tableGuests.length - maxGuestsShown} flere
          </p>
        )}
        {tableGuests.length === 0 && (
          <p className="text-xs text-muted-foreground italic px-1.5 py-1">Ingen gjester ennå</p>
        )}
      </div>
    </div>
  )
}
