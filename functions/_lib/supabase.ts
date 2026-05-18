// Server-side Supabase REST-klient (via service_role) for Pages Functions
import type { Env } from './auth'

const SCHEMA = 'bryllup'

interface RestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  /** Returner-format: 'representation' (default) eller 'minimal' */
  prefer?: string
  /** Query-string parametre */
  query?: Record<string, string>
}

export async function sb<T = unknown>(env: Env, path: string, opts: RestOptions = {}): Promise<T> {
  const url = new URL(`${env.SUPABASE_URL}/rest/v1/${path}`)
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) url.searchParams.set(k, v)
  }

  const headers: Record<string, string> = {
    apikey: env.SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Accept-Profile': SCHEMA,
    'Content-Profile': SCHEMA,
    ...(opts.prefer ? { Prefer: opts.prefer } : { Prefer: 'return=representation' }),
    ...opts.headers,
  }

  const res = await fetch(url.toString(), {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase ${opts.method || 'GET'} ${path}: ${res.status} ${text}`)
  }

  if (res.status === 204) return null as T
  return (await res.json()) as T
}

/** Sjekker at innlogget bruker er medlem av bryllupet. Returnerer wedding-id */
export async function getActiveWedding(env: Env, userEmail: string): Promise<string> {
  const members = await sb<Array<{ wedding_id: string }>>(env, 'wedding_members', {
    query: { user_email: `eq.${userEmail.toLowerCase()}`, select: 'wedding_id' },
  })
  if (!members.length) throw new Error('Ingen tilgang')
  return members[0].wedding_id
}
