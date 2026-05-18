import { create } from 'zustand'
import { api } from '@/lib/api'
import type { WeddingState } from '@/types/database'

interface WeddingStore {
  state: WeddingState | null
  loading: boolean
  error: string | null
  selectedGuestId: string | null
  selectedTableId: string | null

  // Modus: 'browse' = vanlig, 'move' = velger destinasjon for valgt gjest
  mode: 'browse' | 'move'

  fetch: () => Promise<void>
  setSelectedGuest: (id: string | null) => void
  setMode: (mode: 'browse' | 'move') => void

  // Mutasjoner — alle returnerer raskt (optimistisk) og refetcher i bakgrunnen
  assignGuest: (guestId: string, tableId: string) => Promise<void>
  unassign: (assignmentId: string) => Promise<void>
  toggleLock: (assignmentId: string, lock: boolean) => Promise<void>
  updateGuest: (guestId: string, fields: Partial<Record<string, unknown>>) => Promise<void>
  addTable: (name?: string, capacity?: number) => Promise<void>
  updateTable: (tableId: string, fields: Partial<Record<string, unknown>>) => Promise<void>
  deleteTable: (tableId: string) => Promise<void>
  newVersion: (name?: string, fromVersionId?: string) => Promise<void>
  setActiveVersion: (versionId: string) => Promise<void>
  renameVersion: (versionId: string, name: string) => Promise<void>
  deleteVersion: (versionId: string) => Promise<void>
  resetAssignments: (versionId: string) => Promise<void>
  bulkAssign: (versionId: string, assignments: Array<{ guest_id: string; table_id: string }>) => Promise<void>
}

export const useWeddingStore = create<WeddingStore>((set, get) => ({
  state: null,
  loading: false,
  error: null,
  selectedGuestId: null,
  selectedTableId: null,
  mode: 'browse',

  fetch: async () => {
    set({ loading: true, error: null })
    try {
      const state = await api.getState()
      set({ state, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  setSelectedGuest: (id) => set({ selectedGuestId: id }),
  setMode: (mode) => set({ mode }),

  assignGuest: async (guestId, tableId) => {
    const versionId = get().state?.active_version.id
    if (!versionId) return
    await api.mutate({ op: 'assign', guest_id: guestId, table_id: tableId, version_id: versionId })
    await get().fetch()
  },
  unassign: async (assignmentId) => {
    await api.mutate({ op: 'unassign', assignment_id: assignmentId })
    await get().fetch()
  },
  toggleLock: async (assignmentId, lock) => {
    await api.mutate({ op: lock ? 'lock' : 'unlock', assignment_id: assignmentId })
    await get().fetch()
  },
  updateGuest: async (guestId, fields) => {
    await api.mutate({ op: 'update_guest', guest_id: guestId, ...fields })
    await get().fetch()
  },
  addTable: async (name, capacity) => {
    await api.mutate({ op: 'add_table', name, capacity })
    await get().fetch()
  },
  updateTable: async (tableId, fields) => {
    await api.mutate({ op: 'update_table', table_id: tableId, ...fields })
    await get().fetch()
  },
  deleteTable: async (tableId) => {
    await api.mutate({ op: 'delete_table', table_id: tableId })
    await get().fetch()
  },
  newVersion: async (name, fromVersionId) => {
    const from = fromVersionId || get().state?.active_version.id
    await api.mutate({ op: 'new_version', name, from_version_id: from })
    await get().fetch()
  },
  setActiveVersion: async (versionId) => {
    await api.mutate({ op: 'set_active_version', version_id: versionId })
    await get().fetch()
  },
  renameVersion: async (versionId, name) => {
    await api.mutate({ op: 'rename_version', version_id: versionId, name })
    await get().fetch()
  },
  deleteVersion: async (versionId) => {
    await api.mutate({ op: 'delete_version', version_id: versionId })
    await get().fetch()
  },
  resetAssignments: async (versionId) => {
    await api.mutate({ op: 'reset_assignments', version_id: versionId })
    await get().fetch()
  },
  bulkAssign: async (versionId, assignments) => {
    await api.mutate({ op: 'bulk_assign', version_id: versionId, assignments })
    await get().fetch()
  },
}))
