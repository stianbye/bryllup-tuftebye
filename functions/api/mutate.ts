// POST /api/mutate — generell mutasjons-endpoint
// Body: { op: 'assign' | 'unassign' | 'lock' | 'unlock' | 'update_guest' | 'add_table' | 'update_table' | 'delete_table' | 'new_version' | 'set_active_version' | 'delete_version' | 'auto_place' | 'reset_assignments', ...args }
import { getAccessUser, type Env } from '../_lib/auth'
import { sb, getActiveWedding } from '../_lib/supabase'

interface Context {
  request: Request
  env: Env
}

export async function onRequest(context: Context): Promise<Response> {
  if (context.request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const user = await getAccessUser(context.request, context.env)
  if (!user) return json({ error: 'Unauthorized' }, 401)

  try {
    const body = (await context.request.json()) as { op: string; [k: string]: unknown }
    const weddingId = await getActiveWedding(context.env, user.email)

    const result = await handleOp(context.env, weddingId, body)
    return json({ ok: true, result })
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
}

async function handleOp(env: Env, weddingId: string, body: { op: string; [k: string]: unknown }) {
  switch (body.op) {
    case 'assign': {
      // Tildel gjest til bord — upsert på (version_id, guest_id)
      const versionId = body.version_id as string
      const guestId = body.guest_id as string
      const tableId = body.table_id as string

      // Slett eksisterende først (PostgREST upsert er klønete med array)
      await sb(env, 'assignments', {
        method: 'DELETE',
        query: { version_id: `eq.${versionId}`, guest_id: `eq.${guestId}` },
      })
      return sb(env, 'assignments', {
        method: 'POST',
        body: { version_id: versionId, guest_id: guestId, table_id: tableId },
      })
    }

    case 'unassign': {
      return sb(env, 'assignments', {
        method: 'DELETE',
        query: { id: `eq.${body.assignment_id}` },
      })
    }

    case 'lock':
    case 'unlock': {
      return sb(env, 'assignments', {
        method: 'PATCH',
        query: { id: `eq.${body.assignment_id}` },
        body: { is_locked: body.op === 'lock' },
      })
    }

    case 'update_guest': {
      const { op: _op, guest_id, ...fields } = body as {
        op: string
        guest_id: string
        [k: string]: unknown
      }
      return sb(env, 'guests', {
        method: 'PATCH',
        query: { id: `eq.${guest_id}` },
        body: fields,
      })
    }

    case 'add_table': {
      const tables = await sb<Array<{ display_order: number }>>(env, 'tables', {
        query: {
          wedding_id: `eq.${weddingId}`,
          select: 'display_order',
          order: 'display_order.desc',
          limit: '1',
        },
      })
      const nextOrder = (tables[0]?.display_order ?? 0) + 1
      return sb(env, 'tables', {
        method: 'POST',
        body: {
          wedding_id: weddingId,
          name: body.name || `Bord ${nextOrder}`,
          capacity: body.capacity || 7,
          display_order: nextOrder,
        },
      })
    }

    case 'update_table': {
      const { op: _op, table_id, ...fields } = body as {
        op: string
        table_id: string
        [k: string]: unknown
      }
      return sb(env, 'tables', {
        method: 'PATCH',
        query: { id: `eq.${table_id}` },
        body: fields,
      })
    }

    case 'delete_table': {
      return sb(env, 'tables', {
        method: 'DELETE',
        query: { id: `eq.${body.table_id}` },
      })
    }

    case 'new_version': {
      const fromVersionId = body.from_version_id as string
      const name = (body.name as string) || `Versjon ${new Date().toISOString().slice(0, 10)}`
      // Opprett ny versjon (ikke aktiv)
      const newVersions = (await sb<Array<{ id: string }>>(env, 'versions', {
        method: 'POST',
        body: { wedding_id: weddingId, name, is_active: false },
      })) as Array<{ id: string }>
      const newVersionId = newVersions[0].id
      // Kopier assignments fra kildeversjon
      if (fromVersionId) {
        const sourceAssignments = await sb<Array<{ guest_id: string; table_id: string; is_locked: boolean }>>(env, 'assignments', {
          query: { version_id: `eq.${fromVersionId}`, select: 'guest_id,table_id,is_locked' },
        })
        if (sourceAssignments.length) {
          await sb(env, 'assignments', {
            method: 'POST',
            body: sourceAssignments.map((a) => ({ ...a, version_id: newVersionId })),
          })
        }
      }
      return newVersions[0]
    }

    case 'set_active_version': {
      const versionId = body.version_id as string
      // Sett alle inaktive først
      await sb(env, 'versions', {
        method: 'PATCH',
        query: { wedding_id: `eq.${weddingId}` },
        body: { is_active: false },
      })
      return sb(env, 'versions', {
        method: 'PATCH',
        query: { id: `eq.${versionId}` },
        body: { is_active: true },
      })
    }

    case 'rename_version': {
      return sb(env, 'versions', {
        method: 'PATCH',
        query: { id: `eq.${body.version_id}` },
        body: { name: body.name },
      })
    }

    case 'delete_version': {
      return sb(env, 'versions', {
        method: 'DELETE',
        query: { id: `eq.${body.version_id}` },
      })
    }

    case 'reset_assignments': {
      // Slett alle ikke-låste assignments for versjonen
      return sb(env, 'assignments', {
        method: 'DELETE',
        query: { version_id: `eq.${body.version_id}`, is_locked: 'eq.false' },
      })
    }

    case 'bulk_assign': {
      // Brukes av auto-place: erstatt alle ikke-låste assignments med ny mapping
      const versionId = body.version_id as string
      const assignments = body.assignments as Array<{
        guest_id: string
        table_id: string
      }>
      // Hent eksisterende for å bevare låste
      const existing = await sb<Array<{ id: string; guest_id: string; is_locked: boolean }>>(env, 'assignments', {
        query: { version_id: `eq.${versionId}`, select: 'id,guest_id,is_locked' },
      })
      const lockedGuestIds = new Set(existing.filter((a) => a.is_locked).map((a) => a.guest_id))
      // Slett alle ikke-låste
      await sb(env, 'assignments', {
        method: 'DELETE',
        query: { version_id: `eq.${versionId}`, is_locked: 'eq.false' },
      })
      // Insert nye (filtrer ut låste)
      const toInsert = assignments
        .filter((a) => !lockedGuestIds.has(a.guest_id))
        .map((a) => ({
          version_id: versionId,
          guest_id: a.guest_id,
          table_id: a.table_id,
        }))
      if (toInsert.length) {
        return sb(env, 'assignments', { method: 'POST', body: toInsert })
      }
      return { inserted: 0 }
    }

    default:
      throw new Error(`Ukjent op: ${body.op}`)
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
