import { X, Heart, Star } from 'lucide-react'
import { useWeddingStore } from '@/store/wedding'
import { rankTablesForGuest } from '@/lib/recommendations'
import { groupLabel, ageLabel } from '@/lib/colors'
import GuestDot from '@/components/shared/GuestDot'

export default function MobileMoveView() {
  const { state, selectedGuestId, setSelectedGuest, setMode, assignGuest } = useWeddingStore()

  if (!state || !selectedGuestId) return null

  const guest = state.guests.find((g) => g.id === selectedGuestId)
  if (!guest) return null

  const partner = guest.partner_of ? state.guests.find((g) => g.id === guest.partner_of) : null
  const ranked = rankTablesForGuest(state.tables, guest, state.guests, state.assignments)

  const handleClose = () => {
    setMode('browse')
    setSelectedGuest(null)
  }

  const handleSelect = async (tableId: string) => {
    await assignGuest(selectedGuestId, tableId)
    // Hvis partner ikke er plassert ved samme bord, foreslå
    if (partner) {
      const partnerAssign = state.assignments.find((a) => a.guest_id === partner.id)
      if (!partnerAssign || partnerAssign.table_id !== tableId) {
        if (
          confirm(
            `Vil du også flytte ${partner.name} til samme bord? (Par holdes sammen som standard.)`
          )
        ) {
          await assignGuest(partner.id, tableId)
        }
      }
    }
    setMode('browse')
    setSelectedGuest(null)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-primary/15 border-b border-primary/30 pt-safe">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="text-primary p-1.5 -ml-1.5"
            aria-label="Avbryt flytt"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-primary truncate flex items-center gap-1.5">
              <GuestDot group={guest.group_tag} size={7} />
              Flytter {guest.name}
              {partner && <Heart className="h-3 w-3" />}
            </p>
            <p className="text-[11px] text-primary/80 truncate">
              {groupLabel(guest.group_tag)}
              {guest.age_group && ` · ${ageLabel(guest.age_group)}`}
              {partner && ` · partner: ${partner.name}`}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-2">
        <p className="text-xs text-muted-foreground mb-2 px-1">Velg destinasjon</p>
        {ranked.map((r) => {
          const table = state.tables.find((t) => t.id === r.table_id)!
          const tableAssignments = state.assignments.filter((a) => a.table_id === table.id)
          const occupied = tableAssignments.length
          const free = table.capacity - occupied
          const disabled = r.score === -Infinity || r.score < 0
          return (
            <button
              key={r.table_id}
              type="button"
              disabled={disabled}
              onClick={() => handleSelect(r.table_id)}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                r.is_recommended
                  ? 'border-emerald-500/70 bg-emerald-500/10'
                  : disabled
                  ? 'border-border bg-secondary/20 opacity-40'
                  : 'border-border bg-card hover:border-primary/40'
              } active:scale-[0.98]`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-serif text-base">{table.name}</span>
                {r.is_recommended && (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-400 font-medium">
                    <Star className="h-2.5 w-2.5" /> Anbefalt
                  </span>
                )}
                {disabled && r.score === -Infinity && (
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Fullt
                  </span>
                )}
                {disabled && r.score === -100 && (
                  <span className="text-[10px] uppercase tracking-wider text-destructive">
                    Konflikt
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {free > 0 ? `${free} ${free === 1 ? 'plass' : 'plasser'} ledig` : 'Ingen ledige plasser'}
              </p>
              {/* Visuelle stoler */}
              <div className="flex gap-1">
                {Array.from({ length: table.capacity }).map((_, i) => (
                  <span
                    key={i}
                    className={`block w-3 h-3 rounded-full ${
                      i < occupied
                        ? r.is_recommended
                          ? 'bg-emerald-500/60'
                          : 'bg-muted-foreground/50'
                        : 'border border-dashed border-muted-foreground/40'
                    }`}
                  />
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
