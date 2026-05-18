import { groupColor } from '@/lib/colors'
import type { GroupTag } from '@/types/database'

interface Props {
  group: GroupTag | null
  size?: number
  className?: string
}

export default function GuestDot({ group, size = 6, className }: Props) {
  return (
    <span
      className={`inline-block rounded-full flex-shrink-0 ${className || ''}`}
      style={{
        width: size,
        height: size,
        backgroundColor: groupColor(group),
      }}
      aria-hidden="true"
    />
  )
}
