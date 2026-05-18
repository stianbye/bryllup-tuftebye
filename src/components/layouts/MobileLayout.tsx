import { useState } from 'react'
import { useWeddingStore } from '@/store/wedding'
import MobileTablesView from '@/components/mobile/MobileTablesView'
import MobileGuestsView from '@/components/mobile/MobileGuestsView'
import MobileMoveView from '@/components/mobile/MobileMoveView'
import MobileSettingsView from '@/components/mobile/MobileSettingsView'
import BottomNav from '@/components/mobile/BottomNav'
import GuestActionBar from '@/components/mobile/GuestActionBar'

export type MobileTab = 'bord' | 'gjester' | 'innstillinger'

export default function MobileLayout() {
  const { mode, selectedGuestId } = useWeddingStore()
  const [tab, setTab] = useState<MobileTab>('bord')

  // I flyttemodus tar MoveView hele skjermen
  if (mode === 'move' && selectedGuestId) {
    return <MobileMoveView />
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 pb-20">
        {tab === 'bord' && <MobileTablesView />}
        {tab === 'gjester' && <MobileGuestsView />}
        {tab === 'innstillinger' && <MobileSettingsView />}
      </div>

      {selectedGuestId && <GuestActionBar />}

      <BottomNav tab={tab} onChange={setTab} />
    </div>
  )
}
