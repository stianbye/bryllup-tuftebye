import { ArrowRightLeft, Lock, Unlock, MoreHorizontal, X, Heart } from 'lucide-react'
import { useWeddingStore } from '@/store/wedding'
import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import GuestEditSheet from './GuestEditSheet'

export default function GuestActionBar() {
  const {
    state,
    selectedGuestId,
    setSelectedGuest,
    setMode,
    toggleLock,
    unassign,
  } = useWeddingStore()
  const [moreOpen, setMoreOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  if (!state || !selectedGuestId) return null

  const guest = state.guests.find((g) => g.id === selectedGuestId)
  if (!guest) return null

  const assignment = state.assignments.find((a) => a.guest_id === selectedGuestId)
  const isLocked = assignment?.is_locked || false
  const table = assignment ? state.tables.find((t) => t.id === assignment.table_id) : null
  const partner = guest.partner_of ? state.guests.find((g) => g.id === guest.partner_of) : null

  return (
    <>
      <div className="fixed bottom-16 left-0 right-0 bg-popover border-t border-border z-20 animate-slide-up">
        <div className="px-4 py-2 border-b border-border flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate flex items-center gap-1.5">
              {guest.name}
              {partner && <Heart className="h-3 w-3 text-primary" />}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {table ? table.name : 'Ikke plassert'}
              {partner && ` · sammen med ${partner.name}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedGuest(null)}
            className="text-muted-foreground p-2"
            aria-label="Lukk"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 px-3 py-2">
          <ActionButton icon={<ArrowRightLeft className="h-4 w-4" />} onClick={() => setMode('move')}>
            Flytt
          </ActionButton>
          {assignment ? (
            <ActionButton
              icon={isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              onClick={() => toggleLock(assignment.id, !isLocked)}
            >
              {isLocked ? 'Lås opp' : 'Lås'}
            </ActionButton>
          ) : (
            <ActionButton icon={<Lock className="h-4 w-4" />} onClick={() => {}} disabled>
              Lås
            </ActionButton>
          )}
          <ActionButton
            icon={<MoreHorizontal className="h-4 w-4" />}
            onClick={() => setMoreOpen(true)}
          >
            Mer
          </ActionButton>
        </div>
      </div>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <SheetHeader>
            <SheetTitle className="font-serif">{guest.name}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            <MenuItem
              onClick={() => {
                setMoreOpen(false)
                setEditOpen(true)
              }}
            >
              Rediger tags
            </MenuItem>
            {assignment && (
              <MenuItem
                onClick={async () => {
                  await unassign(assignment.id)
                  setMoreOpen(false)
                  setSelectedGuest(null)
                }}
              >
                Fjern fra bord
              </MenuItem>
            )}
            {partner && (
              <MenuItem
                onClick={() => {
                  setSelectedGuest(partner.id)
                  setMoreOpen(false)
                }}
              >
                Velg partner ({partner.name})
              </MenuItem>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <GuestEditSheet
        guest={guest}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  )
}

function ActionButton({
  children,
  icon,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1 py-2.5 rounded-md bg-secondary/40 border border-border text-sm disabled:opacity-50 active:scale-95 transition-transform"
    >
      <span className="text-primary">{icon}</span>
      <span className="text-xs">{children}</span>
    </button>
  )
}

function MenuItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-4 py-3 rounded-md bg-secondary/30 hover:bg-secondary/60 text-sm"
    >
      {children}
    </button>
  )
}
