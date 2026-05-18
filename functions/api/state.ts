// GET /api/state — full bryllups-state for innlogget bruker
import { getAccessUser, type Env } from '../_lib/auth'
import { sb, getActiveWedding } from '../_lib/supabase'

interface Context {
  request: Request
  env: Env
}

export async function onRequest(context: Context): Promise<Response> {
  const user = await getAccessUser(context.request, context.env)
  if (!user) return json({ error: 'Unauthorized' }, 401)

  try {
    const weddingId = await getActiveWedding(context.env, user.email)

    // Hent alt parallelt
    const [wedding, versions, tables, guests, assignments] = await Promise.all([
      sb<unknown[]>(context.env, 'weddings', {
        query: { id: `eq.${weddingId}`, select: '*' },
      }),
      sb<unknown[]>(context.env, 'versions', {
        query: { wedding_id: `eq.${weddingId}`, select: '*', order: 'created_at.asc' },
      }),
      sb<unknown[]>(context.env, 'tables', {
        query: { wedding_id: `eq.${weddingId}`, select: '*', order: 'display_order.asc' },
      }),
      sb<unknown[]>(context.env, 'guests', {
        query: { wedding_id: `eq.${weddingId}`, select: '*', order: 'created_at.asc' },
      }),
      sb<unknown[]>(context.env, 'assignments', {
        query: { select: '*,version:versions!inner(wedding_id)' },
      }),
    ])

    const activeVersion =
      (versions as { is_active: boolean }[]).find((v) => v.is_active) || versions[0]

    // Filter assignments til kun gjeldende bryllup
    const filteredAssignments = (assignments as { version: { wedding_id: string } }[])
      .filter((a) => a.version.wedding_id === weddingId)
      .map((a) => {
        const { version: _v, ...rest } = a as { version: unknown; [k: string]: unknown }
        return rest
      })

    return json({
      user_email: user.email,
      wedding: (wedding as unknown[])[0],
      active_version: activeVersion,
      versions,
      tables,
      guests,
      assignments: filteredAssignments,
    })
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
