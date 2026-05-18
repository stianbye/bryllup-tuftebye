// Bryllup-database typer (matcher bryllup-schema i Supabase)

export type GroupTag =
  | 'brudepar'
  | 'familie_stian'
  | 'familie_laila'
  | 'venner_stian'
  | 'venner_laila'
  | 'jobb_stian'
  | 'jobb_laila'
  | 'naboer'
  | 'annet'

export type AgeGroup = 'barn' | 'ung_voksen' | 'voksen' | 'eldre'

export type Energy = 'rolig' | 'midt' | 'sosial'

export type Role = 'Brud' | 'Brudgom' | 'Forlover' | 'Brudepike' | 'Toastmaster' | 'Fotograf' | null

export interface Wedding {
  id: string
  name: string
  event_date: string | null
  created_at: string
}

export interface Version {
  id: string
  wedding_id: string
  name: string
  is_active: boolean
  created_at: string
}

export interface TableEntity {
  id: string
  wedding_id: string
  name: string
  capacity: number
  display_order: number
  notes: string | null
  created_at: string
}

export interface Guest {
  id: string
  wedding_id: string
  name: string
  group_tag: GroupTag | null
  age_group: AgeGroup | null
  partner_of: string | null
  language: string
  energy: Energy | null
  must_sit_with: string[]
  must_not_sit_with: string[]
  dietary: string | null
  notes: string | null
  role: Role
  is_couple_member: boolean
  created_at: string
}

export interface Assignment {
  id: string
  version_id: string
  guest_id: string
  table_id: string
  is_locked: boolean
  created_at: string
}

export interface WeddingMember {
  wedding_id: string
  user_email: string
  role: string
}

// Komplett state returnert fra /api/state
export interface WeddingState {
  user_email: string
  wedding: Wedding
  active_version: Version
  versions: Version[]
  tables: TableEntity[]
  guests: Guest[]
  assignments: Assignment[]
}

// Konflikt-typer (computed client-side)
export type ConflictLevel = 'error' | 'warning'

export interface Conflict {
  level: ConflictLevel
  table_id: string
  message: string
  guest_ids?: string[]
}
