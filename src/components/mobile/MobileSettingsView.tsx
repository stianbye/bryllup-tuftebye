import { useState } from 'react'
import { Plus, Trash2, Printer, Wand2, RotateCcw, AlertCircle } from 'lucide-react'
import { useWeddingStore } from '@/store/wedding'
import { Button } from '@/components/ui/button'
import { detectAllConflicts } from '@/lib/conflicts'
import { autoPlace } from '@/lib/auto-place'

export default function MobileSettingsView() {
  const {
    state,
    addTable,
    updateTable,
    deleteTable,
    bulkAssign,
    resetAssignments,
  } = useWeddingStore()
  const [editingTable, setEditingTable] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editCapacity, setEditCapacity] = useState(7)
  const [autoBusy, setAutoBusy] = useState(false)

  if (!state) return null
  const { tables, guests, assignments, active_version } = state

  const conflicts = detectAllConflicts(tables, guests, assignments)

  const handleEditStart = (tableId: string) => {
    const t = tables.find((x) => x.id === tableId)
    if (!t) return
    setEditingTable(tableId)
    setEditName(t.name)
    setEditCapacity(t.capacity)
  }

  const handleEditSave = async () => {
    if (!editingTable) return
    await updateTable(editingTable, { name: editName, capacity: editCapacity })
    setEditingTable(null)
  }

  const handleAutoPlace = async () => {
    const placed = assignments.length
    const total = guests.length
    if (placed === total) {
      alert('Alle gjester er allerede plassert.')
      return
    }
    if (!confirm(`Auto-plassere ${total - placed} uplasserte gjester? Du kan flytte etterpå.`)) return
    setAutoBusy(true)
    const result = autoPlace(tables, guests, assignments)
    // Bare nye plasseringer (de eksisterende beholdes)
    const allAssignments = [
      ...assignments.map((a) => ({ guest_id: a.guest_id, table_id: a.table_id })),
      ...result,
    ]
    await bulkAssign(active_version.id, allAssignments)
    setAutoBusy(false)
    alert(`${result.length} gjester ble plassert.`)
  }

  const handleReset = async () => {
    if (
      !confirm(
        'Nullstille alle plasseringer i denne versjonen? (Låste gjester beholdes.) Dette kan ikke angres.'
      )
    )
      return
    await resetAssignments(active_version.id)
  }

  const handlePrint = () => {
    window.open('/print', '_blank')
  }

  return (
    <div className="flex flex-col pt-safe">
      <div className="px-4 py-3 border-b border-border">
        <h1 className="font-serif text-lg">Innstillinger</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Smart-handlinger */}
        <section>
          <h2 className="eyebrow mb-2">Smart-handlinger</h2>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={handleAutoPlace} disabled={autoBusy}>
              <Wand2 className="mr-2 h-4 w-4 text-primary" />
              Auto-forslag for uplasserte
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4 text-primary" />
              Print bordplassering
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-destructive"
              onClick={handleReset}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Nullstill plasseringer (i versjonen)
            </Button>
          </div>
        </section>

        {/* Konflikter */}
        {conflicts.length > 0 && (
          <section>
            <h2 className="eyebrow mb-2">
              Konflikter · {conflicts.filter((c) => c.level === 'error').length} feil ·{' '}
              {conflicts.filter((c) => c.level === 'warning').length} advarsler
            </h2>
            <div className="space-y-1">
              {conflicts.map((c, i) => (
                <div
                  key={i}
                  className={`text-xs p-2 rounded ${
                    c.level === 'error'
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-amber-500/10 text-amber-500'
                  }`}
                >
                  <AlertCircle className="inline h-3 w-3 mr-1" />
                  {c.message}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bord */}
        <section>
          <h2 className="eyebrow mb-2">Bord ({tables.length})</h2>
          <div className="space-y-2">
            {tables.map((t) => {
              const occ = assignments.filter((a) => a.table_id === t.id).length
              return (
                <div key={t.id} className="bg-secondary/30 border border-border rounded-lg p-3">
                  {editingTable === t.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-secondary border border-border rounded-md px-3 py-1.5 text-sm"
                      />
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground">Plasser:</label>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={editCapacity}
                          onChange={(e) => setEditCapacity(parseInt(e.target.value) || 1)}
                          className="w-16 bg-secondary border border-border rounded-md px-2 py-1 text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleEditSave} className="flex-1">
                          Lagre
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingTable(null)}
                          className="flex-1"
                        >
                          Avbryt
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleEditStart(t.id)}
                        className="flex-1 text-left"
                      >
                        <div className="text-sm font-medium">{t.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {occ}/{t.capacity} plasser
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (occ > 0) {
                            if (!confirm(`${t.name} har ${occ} plasserte gjester. Slette uansett?`))
                              return
                          }
                          deleteTable(t.id)
                        }}
                        className="text-destructive p-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            <Button variant="outline" className="w-full" onClick={() => addTable()}>
              <Plus className="mr-2 h-4 w-4" /> Legg til bord
            </Button>
          </div>
        </section>

        {/* Info */}
        <section className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border">
          <p>Logget inn som: {state.user_email}</p>
          <p>Bryllup: {state.wedding.name}</p>
          <p>Versjon: {active_version.name}</p>
        </section>
      </div>
    </div>
  )
}
