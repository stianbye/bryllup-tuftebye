import { useDraggable } from '@dnd-kit/core'
import { Edit3, Heart } from 'lucide-react'
import GuestDot from '@/components/shared/GuestDot'
import type { Guest } from '@/types/database'

interface Props {
  guest: Guest
  selected?: boolean
  onClick?: () => void
  onEdit?: () => void
}

export default function DraggableGuest({ guest, selected, onClick, onEdit }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: guest.id })

  return (
    <div
      ref={setNodeRef}
      className={`group relative rounded-md border bg-card transition-all ${
        selected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/40'
      } ${isDragging ? 'opacity-30' : ''}`}
    >
      <button
        type="button"
        onClick={onClick}
        {...listeners}
        {...attributes}
        className="w-full flex items-center gap-2 px-2.5 py-2 text-sm text-left cursor-grab active:cursor-grabbing"
      >
        <GuestDot group={guest.group_tag} size={6} />
        <span className="flex-1 truncate">{guest.name}</span>
        {guest.is_couple_member && <Heart className="h-3 w-3 text-primary flex-shrink-0" />}
        {guest.role && (
          <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider text-primary bg-primary/10">
            {guest.role}
          </span>
        )}
      </button>
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-opacity"
          aria-label="Rediger"
        >
          <Edit3 className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
