import { useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { useWeddingStore } from '@/store/wedding'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

export default function VersionPill() {
  const { state, setActiveVersion, newVersion, deleteVersion } = useWeddingStore()
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  if (!state) return null
  const { active_version, versions } = state

  const handleCreate = async () => {
    setCreating(true)
    await newVersion(newName || undefined, active_version.id)
    setNewName('')
    setCreating(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-primary/40 bg-primary/10 text-primary text-xs"
        >
          <span className="font-medium">{active_version.name}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle className="font-serif">Versjoner</SheetTitle>
        </SheetHeader>
        <div className="space-y-2 mt-4">
          {versions.map((v) => (
            <div
              key={v.id}
              className={`p-3 rounded-lg border flex items-center justify-between ${
                v.is_active ? 'border-primary/60 bg-primary/10' : 'border-border bg-secondary/30'
              }`}
            >
              <button
                type="button"
                className="flex-1 text-left"
                onClick={() => {
                  setActiveVersion(v.id).then(() => setOpen(false))
                }}
              >
                <div className="font-medium text-sm">{v.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {v.is_active ? 'Aktiv versjon' : 'Tap for å aktivere'}
                </div>
              </button>
              {versions.length > 1 && !v.is_active && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Slette ${v.name}?`)) deleteVersion(v.id)
                  }}
                  className="text-xs text-destructive px-2 py-1"
                >
                  Slett
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Ny versjon (kopierer aktiv)</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Navn (valgfritt)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 bg-secondary border border-border rounded-md px-3 py-2 text-sm"
            />
            <Button onClick={handleCreate} disabled={creating}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
