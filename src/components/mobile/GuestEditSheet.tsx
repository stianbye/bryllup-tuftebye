import { useState, useEffect } from 'react'
import { useWeddingStore } from '@/store/wedding'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import type { Guest } from '@/types/database'

interface Props {
  guest: Guest
  open: boolean
  onOpenChange: (open: boolean) => void
}

const GROUPS = [
  { value: 'brudepar', label: 'Brudepar' },
  { value: 'familie_stian', label: 'Familie Stian' },
  { value: 'familie_laila', label: 'Familie Laila' },
  { value: 'venner_stian', label: 'Venner Stian' },
  { value: 'venner_laila', label: 'Venner Laila' },
  { value: 'jobb_stian', label: 'Jobb Stian' },
  { value: 'jobb_laila', label: 'Jobb Laila' },
  { value: 'naboer', label: 'Naboer' },
  { value: 'annet', label: 'Annet' },
]

const AGES = [
  { value: 'barn', label: 'Barn' },
  { value: 'ung_voksen', label: 'Ung voksen' },
  { value: 'voksen', label: 'Voksen' },
  { value: 'eldre', label: 'Eldre' },
]

const ENERGIES = [
  { value: 'rolig', label: 'Rolig' },
  { value: 'midt', label: 'Midt' },
  { value: 'sosial', label: 'Sosial' },
]

export default function GuestEditSheet({ guest, open, onOpenChange }: Props) {
  const { state, updateGuest } = useWeddingStore()
  const [groupTag, setGroupTag] = useState(guest.group_tag || '')
  const [ageGroup, setAgeGroup] = useState(guest.age_group || '')
  const [energy, setEnergy] = useState(guest.energy || '')
  const [notes, setNotes] = useState(guest.notes || '')
  const [dietary, setDietary] = useState(guest.dietary || '')
  const [mustSitWith, setMustSitWith] = useState<string[]>(guest.must_sit_with || [])
  const [mustNotSitWith, setMustNotSitWith] = useState<string[]>(guest.must_not_sit_with || [])

  useEffect(() => {
    setGroupTag(guest.group_tag || '')
    setAgeGroup(guest.age_group || '')
    setEnergy(guest.energy || '')
    setNotes(guest.notes || '')
    setDietary(guest.dietary || '')
    setMustSitWith(guest.must_sit_with || [])
    setMustNotSitWith(guest.must_not_sit_with || [])
  }, [guest.id])

  const otherGuests = state?.guests.filter((g) => g.id !== guest.id) || []

  const handleSave = async () => {
    await updateGuest(guest.id, {
      group_tag: groupTag || null,
      age_group: ageGroup || null,
      energy: energy || null,
      notes: notes || null,
      dietary: dietary || null,
      must_sit_with: mustSitWith,
      must_not_sit_with: mustNotSitWith,
    })
    onOpenChange(false)
  }

  const toggleInList = (list: string[], setList: (l: string[]) => void, id: string) => {
    if (list.includes(id)) setList(list.filter((x) => x !== id))
    else setList([...list, id])
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-serif">{guest.name}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4 pb-8">
          <Field label="Gruppe">
            <Select value={groupTag} onChange={setGroupTag} options={GROUPS} />
          </Field>
          <Field label="Aldersgruppe">
            <Select value={ageGroup} onChange={setAgeGroup} options={AGES} />
          </Field>
          <Field label="Energi">
            <Select value={energy} onChange={setEnergy} options={ENERGIES} />
          </Field>
          <Field label="Allergier / mat">
            <input
              type="text"
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
              placeholder="F.eks. vegetar, glutenfri"
              className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Notater">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Må sitte med (utover par)">
            <GuestMultiSelect
              guests={otherGuests}
              selected={mustSitWith}
              onToggle={(id) => toggleInList(mustSitWith, setMustSitWith, id)}
            />
          </Field>

          <Field label="Kan ikke sitte med">
            <GuestMultiSelect
              guests={otherGuests}
              selected={mustNotSitWith}
              onToggle={(id) => toggleInList(mustNotSitWith, setMustNotSitWith, id)}
            />
          </Field>

          <div className="sticky bottom-0 bg-popover pt-3 -mx-6 px-6 border-t border-border">
            <Button onClick={handleSave} className="w-full">
              Lagre endringer
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
    >
      <option value="">— ikke satt —</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function GuestMultiSelect({
  guests,
  selected,
  onToggle,
}: {
  guests: Guest[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  const [search, setSearch] = useState('')
  const filtered = guests
    .filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'no'))
  return (
    <div className="space-y-2">
      <input
        type="search"
        placeholder="Søk…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-secondary border border-border rounded-md px-3 py-1.5 text-sm"
      />
      <div className="max-h-40 overflow-y-auto scrollbar-thin border border-border rounded-md bg-secondary/30 divide-y divide-border/40">
        {filtered.map((g) => (
          <label
            key={g.id}
            className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-secondary/60"
          >
            <input
              type="checkbox"
              checked={selected.includes(g.id)}
              onChange={() => onToggle(g.id)}
              className="accent-primary"
            />
            <span>{g.name}</span>
          </label>
        ))}
        {!filtered.length && (
          <p className="px-3 py-2 text-xs text-muted-foreground">Ingen match</p>
        )}
      </div>
      {selected.length > 0 && (
        <p className="text-[11px] text-primary">{selected.length} valgt</p>
      )}
    </div>
  )
}
