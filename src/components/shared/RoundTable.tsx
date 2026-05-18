import { groupColor } from '@/lib/colors'
import type { Assignment, Guest, TableEntity } from '@/types/database'

interface Props {
  table: TableEntity
  guests: Guest[]
  assignments: Assignment[]
  size?: number // px
  onSeatClick?: (guest: Guest | null, seatIndex: number) => void
  highlightGuestId?: string | null
}

export default function RoundTable({
  table,
  guests,
  assignments,
  size = 200,
  onSeatClick,
  highlightGuestId,
}: Props) {
  const tableAssignments = assignments.filter((a) => a.table_id === table.id)
  const guestsAtTable = tableAssignments
    .map((a) => guests.find((g) => g.id === a.guest_id))
    .filter((g): g is Guest => !!g)

  const cx = size / 2
  const cy = size / 2
  const tableRadius = size * 0.22
  const seatRadius = size * 0.36
  const seatSize = size * 0.075

  const seats = Array.from({ length: table.capacity }).map((_, i) => {
    const angle = (i / table.capacity) * Math.PI * 2 - Math.PI / 2
    const x = cx + Math.cos(angle) * seatRadius
    const y = cy + Math.sin(angle) * seatRadius
    const guest = guestsAtTable[i]
    return { x, y, angle, guest, index: i }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="select-none">
      {/* Bord-skive */}
      <circle
        cx={cx}
        cy={cy}
        r={tableRadius}
        fill="#1e2d45"
        stroke="#C4A060"
        strokeWidth={1.5}
        opacity={0.85}
      />
      {/* Bord-navn i midten */}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        fill="#EAE2D4"
        fontSize={size * 0.058}
        fontFamily='"Playfair Display", serif'
        fontWeight={500}
      >
        {table.name}
      </text>
      <text
        x={cx}
        y={cy + size * 0.05}
        textAnchor="middle"
        fill="#8A9AA8"
        fontSize={size * 0.04}
        fontFamily="Inter, sans-serif"
      >
        {guestsAtTable.length}/{table.capacity}
      </text>

      {/* Stoler */}
      {seats.map(({ x, y, guest, index, angle }) => {
        const filled = !!guest
        const color = filled ? groupColor(guest.group_tag) : '#3b4862'
        const isHighlight = guest?.id === highlightGuestId
        return (
          <g
            key={index}
            className={onSeatClick ? 'cursor-pointer' : ''}
            onClick={() => onSeatClick?.(guest ?? null, index)}
          >
            <circle
              cx={x}
              cy={y}
              r={seatSize}
              fill={filled ? color : 'transparent'}
              stroke={filled ? color : '#3b4862'}
              strokeWidth={isHighlight ? 2.5 : 1.5}
              strokeDasharray={filled ? undefined : '3 2'}
              opacity={isHighlight ? 1 : 0.9}
            />
            {filled && guest && (
              <text
                x={x}
                y={y + size * 0.135}
                textAnchor="middle"
                fill="#EAE2D4"
                fontSize={size * 0.05}
                fontFamily="Inter, sans-serif"
                fontWeight={isHighlight ? 600 : 500}
                style={{ pointerEvents: 'none' }}
              >
                {guest.name.length > 12 ? guest.name.slice(0, 11) + '…' : guest.name}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
