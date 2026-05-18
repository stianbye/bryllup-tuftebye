import type { Assignment, Guest, TableEntity } from '@/types/database'

/**
 * Score for hvor godt en gjest passer ved et gitt bord.
 * Høyere score = bedre match. Returnerer -Infinity hvis ingen plass,
 * og -100 hvis flytting bryter hard regel.
 */
export function scoreTableForGuest(
  table: TableEntity,
  guest: Guest,
  guests: Guest[],
  assignments: Assignment[]
): number {
  const guestsAtTable = assignments
    .filter((a) => a.table_id === table.id && a.guest_id !== guest.id)
    .map((a) => guests.find((g) => g.id === a.guest_id))
    .filter((g): g is Guest => !!g)

  // Hard: ingen plass
  if (guestsAtTable.length >= table.capacity) return -Infinity

  // Hard: regel-brudd
  for (const other of guestsAtTable) {
    if (
      (guest.must_not_sit_with || []).includes(other.id) ||
      (other.must_not_sit_with || []).includes(guest.id)
    ) {
      return -100
    }
  }

  let score = 10 // baseline for ledig plass

  // Partner ved bordet
  if (guest.partner_of && guestsAtTable.some((o) => o.id === guest.partner_of)) {
    score += 30
  }

  // Må-sitte-med oppfylt
  for (const mustId of guest.must_sit_with || []) {
    if (guestsAtTable.some((o) => o.id === mustId)) score += 20
  }

  // Samme gruppe-tag
  const sameGroup = guestsAtTable.filter((o) => o.group_tag === guest.group_tag).length
  score += sameGroup * 5

  // Samme aldersgruppe
  const sameAge = guestsAtTable.filter((o) => o.age_group === guest.age_group).length
  score += sameAge * 3

  // Bonus for sosial mix: hvis bordet bare har én annen gruppe og gjesten er en ny gruppe
  const groups = new Set(guestsAtTable.map((g) => g.group_tag).filter(Boolean))
  if (groups.size === 1 && guest.group_tag && !groups.has(guest.group_tag) && guestsAtTable.length >= 3) {
    score += 4 // litt bonus for blanding
  }

  // Bonus for ledig plass når bordet ikke er fullt
  const freeSeats = table.capacity - guestsAtTable.length
  if (freeSeats >= 2) score += 2

  return score
}

export interface TableRecommendation {
  table_id: string
  score: number
  is_recommended: boolean
}

/** Returnerer alle aktuelle bord rangert etter score, med øverste merket som anbefalt. */
export function rankTablesForGuest(
  tables: TableEntity[],
  guest: Guest,
  guests: Guest[],
  assignments: Assignment[]
): TableRecommendation[] {
  const scored = tables.map((t) => ({
    table_id: t.id,
    score: scoreTableForGuest(t, guest, guests, assignments),
    is_recommended: false,
  }))
  scored.sort((a, b) => b.score - a.score)
  // Anbefal kun hvis topp-score er positiv
  if (scored.length && scored[0].score > 0) scored[0].is_recommended = true
  return scored
}
