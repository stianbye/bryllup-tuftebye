import type { Assignment, Guest, TableEntity } from '@/types/database'
import { detectAllConflicts } from './conflicts'

export type InsightKind =
  | 'progress'
  | 'conflict'
  | 'couple-split'
  | 'role-cluster'
  | 'group-imbalance'
  | 'empty-table'
  | 'days-left'
  | 'celebration'

export interface Insight {
  id: string
  kind: InsightKind
  priority: number // høyere = viktigere
  title: string
  detail: string
  action_label?: string
  action_id?: string // f.eks. 'jump_to_table_<id>' eller 'jump_to_guest_<id>'
}

export function generateInsights(
  guests: Guest[],
  tables: TableEntity[],
  assignments: Assignment[],
  eventDate: string | null
): Insight[] {
  const insights: Insight[] = []

  // 1. Fremgang
  const placed = assignments.length
  const total = guests.length
  const pct = total > 0 ? Math.round((placed / total) * 100) : 0
  if (placed < total) {
    const remaining = total - placed
    insights.push({
      id: 'progress',
      kind: 'progress',
      priority: 60,
      title: `${remaining} ${remaining === 1 ? 'gjest' : 'gjester'} igjen å plassere`,
      detail: `${pct}% ferdig. Bruk Auto-forslag for et utgangspunkt.`,
    })
  } else {
    insights.push({
      id: 'progress',
      kind: 'celebration',
      priority: 90,
      title: 'Alle gjester er plassert',
      detail: 'Du kan låse plasseringer som er ferdige.',
    })
  }

  // 2. Dager igjen
  if (eventDate) {
    const days = Math.ceil((new Date(eventDate).getTime() - Date.now()) / 86400000)
    if (days > 0) {
      insights.push({
        id: 'days-left',
        kind: 'days-left',
        priority: 40,
        title: `${days} ${days === 1 ? 'dag' : 'dager'} til bryllupet`,
        detail: new Date(eventDate).toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' }),
      })
    }
  }

  // 3. Konflikter
  const conflicts = detectAllConflicts(tables, guests, assignments)
  const errors = conflicts.filter((c) => c.level === 'error')
  const warnings = conflicts.filter((c) => c.level === 'warning')
  if (errors.length > 0) {
    insights.push({
      id: 'conflicts-error',
      kind: 'conflict',
      priority: 100,
      title: `${errors.length} alvorlig${errors.length === 1 ? '' : 'e'} konflikt${errors.length === 1 ? '' : 'er'}`,
      detail: errors.slice(0, 2).map((c) => c.message).join(' · '),
    })
  }

  // 4. Splittede par (kan flikkes raskt)
  const coupleIssues = warnings.filter((c) => c.message.includes('ikke ved samme bord'))
  if (coupleIssues.length > 0) {
    insights.push({
      id: 'couple-split',
      kind: 'couple-split',
      priority: 80,
      title: `${coupleIssues.length} par sitter ikke sammen`,
      detail: coupleIssues.slice(0, 2).map((c) => c.message).join(' · '),
    })
  }

  // 5. Hvert bord med kun én gjestegruppe — diversitet
  const imbalance = warnings.filter((c) => c.message.includes('Bare én gjestegruppe'))
  if (imbalance.length > 0) {
    insights.push({
      id: 'group-imbalance',
      kind: 'group-imbalance',
      priority: 50,
      title: `${imbalance.length} bord mangler blanding`,
      detail: 'Vurder å flytte noen for mer sosial dynamikk.',
    })
  }

  // 6. Tomme bord
  const emptyTables = tables.filter((t) => !assignments.some((a) => a.table_id === t.id))
  if (emptyTables.length > 0 && placed > 0) {
    insights.push({
      id: 'empty-tables',
      kind: 'empty-table',
      priority: 30,
      title: `${emptyTables.length} tom${emptyTables.length === 1 ? 't' : 'me'} bord`,
      detail: emptyTables.map((t) => t.name).join(', '),
    })
  }

  // 7. Roller — er forloverne i nærheten av brudeparet?
  const bridalRoles = ['Forlover', 'Toastmaster', 'Brudepike']
  const bridalGuests = guests.filter((g) => g.role && bridalRoles.includes(g.role))
  const brideGroom = guests.filter((g) => g.role === 'Brud' || g.role === 'Brudgom')
  if (bridalGuests.length > 0 && brideGroom.length > 0) {
    const bgAssignment = assignments.find((a) => brideGroom.some((b) => b.id === a.guest_id))
    if (bgAssignment) {
      const farRoles = bridalGuests.filter((b) => {
        const ba = assignments.find((a) => a.guest_id === b.id)
        return ba && ba.table_id !== bgAssignment.table_id
      })
      if (farRoles.length > 0 && farRoles.length < bridalGuests.length) {
        insights.push({
          id: 'role-cluster',
          kind: 'role-cluster',
          priority: 35,
          title: 'Forlovere/brudepiker spredd',
          detail: `${farRoles.length} av ${bridalGuests.length} sitter ikke ved brudebordet`,
        })
      }
    }
  }

  // Sortér etter priority descending
  return insights.sort((a, b) => b.priority - a.priority)
}
