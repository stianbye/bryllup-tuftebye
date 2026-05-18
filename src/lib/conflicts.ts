import type { Assignment, Conflict, Guest, TableEntity } from '@/types/database'

/**
 * Returnerer alle aktive konflikter på tvers av alle bord for én versjon.
 * Konflikter klassifiseres som 'error' (harde regelbrudd) eller 'warning' (soft).
 */
export function detectAllConflicts(
  tables: TableEntity[],
  guests: Guest[],
  assignments: Assignment[]
): Conflict[] {
  const conflicts: Conflict[] = []
  for (const t of tables) {
    conflicts.push(...conflictsForTable(t, guests, assignments))
  }
  return conflicts
}

export function conflictsForTable(
  table: TableEntity,
  guests: Guest[],
  assignments: Assignment[]
): Conflict[] {
  const conflicts: Conflict[] = []
  const guestsAtTable = assignments
    .filter((a) => a.table_id === table.id)
    .map((a) => guests.find((g) => g.id === a.guest_id))
    .filter((g): g is Guest => !!g)

  // 1. Kapasitet
  if (guestsAtTable.length > table.capacity) {
    conflicts.push({
      level: 'error',
      table_id: table.id,
      message: `Overfylt (${guestsAtTable.length}/${table.capacity})`,
    })
  }

  // 2. Hard-regel: må-ikke-sitte-med
  for (const g of guestsAtTable) {
    for (const blockedId of g.must_not_sit_with || []) {
      if (guestsAtTable.some((o) => o.id === blockedId)) {
        const blocked = guests.find((x) => x.id === blockedId)
        if (blocked && g.id < blocked.id) {
          // bare report én gang per par
          conflicts.push({
            level: 'error',
            table_id: table.id,
            message: `${g.name} og ${blocked.name} skal ikke sitte sammen`,
            guest_ids: [g.id, blocked.id],
          })
        }
      }
    }
  }

  // 3. Soft: splittet par
  for (const g of guestsAtTable) {
    if (g.partner_of) {
      const partner = guests.find((p) => p.id === g.partner_of)
      const partnerHere = guestsAtTable.some((o) => o.id === g.partner_of)
      if (partner && !partnerHere && g.id < partner.id) {
        conflicts.push({
          level: 'warning',
          table_id: table.id,
          message: `${g.name} er ikke ved samme bord som ${partner.name}`,
          guest_ids: [g.id, partner.id],
        })
      }
    }
  }

  // 4. Soft: kun én gruppe ved bord med 4+ gjester (men brudepar-bordet er unntak)
  if (guestsAtTable.length >= 4) {
    const groups = new Set(
      guestsAtTable.map((g) => g.group_tag).filter((g): g is NonNullable<typeof g> => !!g && g !== 'brudepar')
    )
    if (groups.size === 1) {
      conflicts.push({
        level: 'warning',
        table_id: table.id,
        message: 'Bare én gjestegruppe — vurder å blande',
      })
    }
  }

  // 5. Soft: må-sitte-med ikke oppfylt
  for (const g of guestsAtTable) {
    for (const mustId of g.must_sit_with || []) {
      if (!guestsAtTable.some((o) => o.id === mustId)) {
        const wanted = guests.find((x) => x.id === mustId)
        if (wanted && g.id < wanted.id) {
          conflicts.push({
            level: 'warning',
            table_id: table.id,
            message: `${g.name} ønsker å sitte med ${wanted.name}`,
            guest_ids: [g.id, wanted.id],
          })
        }
      }
    }
  }

  return conflicts
}

/** Returnerer kort status for et bord: ok | warning | error */
export function tableStatus(
  table: TableEntity,
  guests: Guest[],
  assignments: Assignment[]
): 'ok' | 'warning' | 'error' {
  const cs = conflictsForTable(table, guests, assignments)
  if (cs.some((c) => c.level === 'error')) return 'error'
  if (cs.some((c) => c.level === 'warning')) return 'warning'
  return 'ok'
}
