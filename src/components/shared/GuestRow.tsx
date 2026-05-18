import { Lock, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Guest, Assignment } from '@/types/database'
import GuestDot from './GuestDot'

interface Props {
  guest: Guest
  assignment?: Assignment | null
  selected?: boolean
  onClick?: () => void
  compact?: boolean
  showRole?: boolean
}

export default function GuestRow({
  guest,
  assignment,
  selected,
  onClick,
  compact,
  showRole = true,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 text-left transition-all',
        compact ? 'py-1 px-1.5 text-xs' : 'py-2 px-2.5 text-sm',
        'rounded-md',
        selected
          ? 'bg-primary/20 ring-1 ring-primary'
          : 'bg-secondary/30 hover:bg-secondary/60',
        onClick ? 'cursor-pointer' : 'cursor-default'
      )}
    >
      <GuestDot group={guest.group_tag} size={compact ? 5 : 7} />
      <span className="flex-1 truncate text-foreground">{guest.name}</span>
      {guest.is_couple_member && (
        <Heart className={cn('flex-shrink-0 text-primary', compact ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
      )}
      {showRole && guest.role && (
        <span
          className={cn(
            'px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider text-primary bg-primary/10 flex-shrink-0',
            compact && 'text-[9px]'
          )}
        >
          {guest.role}
        </span>
      )}
      {assignment?.is_locked && (
        <Lock className={cn('flex-shrink-0 text-primary', compact ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
      )}
    </button>
  )
}
