import type { Assignment, Guest, TableEntity } from '@/types/database'
import { scoreTableForGuest } from './recommendations'

/**
 * Auto-plasserer uplasserte gjester ved bord.
 * Greedy: sortér etter "constraint-tetthet" (hard regler først), deretter score.
 * Returnerer foreslåtte nye assignments (uten å skrive til DB).
 */
export function autoPlace(
  tables: TableEntity[],
  guests: Guest[],
  assignments: Assignment[]
): Array<{ guest_id: string; table_id: string }> {
  // Finn allerede plasserte
  const placedIds = new Set(assignments.map((a) => a.guest_id))
  const unplaced = guests.filter((g) => !placedIds.has(g.id))

  // Sortér: par sammen som "blokker", harde-regler først, ellers etter alder/gruppe
  const blocks = groupByCouple(unplaced)
  blocks.sort((a, b) => constraintWeight(b) - constraintWeight(a))

  const newAssignments: Array<{ guest_id: string; table_id: string }> = []
  const workingAssignments = [...assignments]

  for (const block of blocks) {
    // Score alle bord for blokken (vurder kapasitet for hele blokken)
    let best: { table_id: string; score: number } | null = null
    for (const table of tables) {
      const tableGuests = workingAssignments.filter((a) => a.table_id === table.id).length
      if (tableGuests + block.length > table.capacity) continue

      // Sum av score for alle i blokken (de antas å sitte sammen)
      const blockScore = block.reduce(
        (sum, g) =>
          sum + scoreTableForGuest(table, g, guests, workingAssignments),
        0
      )
      if (!best || blockScore > best.score) {
        best = { table_id: table.id, score: blockScore }
      }
    }

    if (best && best.score > -Infinity) {
      for (const g of block) {
        newAssignments.push({ guest_id: g.id, table_id: best.table_id })
        // Simuler at gjesten er plassert
        workingAssignments.push({
          id: `temp-${g.id}`,
          version_id: '',
          guest_id: g.id,
          table_id: best.table_id,
          is_locked: false,
          created_at: '',
        })
      }
    }
  }

  return newAssignments
}

/** Grupperer par sammen til "blokker" som plasseres samtidig */
function groupByCouple(guests: Guest[]): Guest[][] {
  const seen = new Set<string>()
  const blocks: Guest[][] = []
  for (const g of guests) {
    if (seen.has(g.id)) continue
    seen.add(g.id)
    if (g.partner_of) {
      const partner = guests.find((p) => p.id === g.partner_of)
      if (partner) {
        seen.add(partner.id)
        blocks.push([g, partner])
        continue
      }
    }
    blocks.push([g])
  }
  return blocks
}

/** Vekt for sortering: harde constraints og store blokker plasseres først */
function constraintWeight(block: Guest[]): number {
  let w = block.length * 10 // par har høyere vekt enn singler
  for (const g of block) {
    w += (g.must_sit_with?.length || 0) * 5
    w += (g.must_not_sit_with?.length || 0) * 5
    if (g.role) w += 3 // folk med roller (forlover, brudepike) prioriteres
  }
  return w
}
