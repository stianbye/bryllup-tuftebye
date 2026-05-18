// GET /api/me — returnerer innlogget bruker (eller 401)
import { getAccessUser, type Env } from '../_lib/auth'

interface Context {
  request: Request
  env: Env
}

export async function onRequest(context: Context): Promise<Response> {
  const user = await getAccessUser(context.request, context.env)
  if (!user) return json({ error: 'Unauthorized' }, 401)
  return json({ email: user.email })
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
