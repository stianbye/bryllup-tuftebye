import { LayoutGrid, Users, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MobileTab } from '../layouts/MobileLayout'

interface Props {
  tab: MobileTab
  onChange: (t: MobileTab) => void
}

export default function BottomNav({ tab, onChange }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-popover border-t border-border pb-safe z-30"
      role="navigation"
    >
      <div className="flex">
        <NavItem
          icon={<LayoutGrid className="h-5 w-5" />}
          label="Bord"
          active={tab === 'bord'}
          onClick={() => onChange('bord')}
        />
        <NavItem
          icon={<Users className="h-5 w-5" />}
          label="Gjester"
          active={tab === 'gjester'}
          onClick={() => onChange('gjester')}
        />
        <NavItem
          icon={<Settings className="h-5 w-5" />}
          label="Innstillinger"
          active={tab === 'innstillinger'}
          onClick={() => onChange('innstillinger')}
        />
      </div>
    </nav>
  )
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors',
        active ? 'text-primary' : 'text-muted-foreground'
      )}
      onClick={onClick}
    >
      {icon}
      <span className="text-[10px] uppercase tracking-wider">{label}</span>
    </button>
  )
}
