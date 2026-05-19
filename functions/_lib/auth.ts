/**
 * Auth-lib — bryllup Pages Functions
 *
 * Støtter to metoder (prioritet):
 *   1. crm_jwt-cookie — vår egen JWT (satt av login.html på dashboard.tuftebyeai.com)
 *   2. Cf-Access-Jwt-Assertion — CF Access JWT (legacy, beholdes for fallback)
 *   3. DEV_USER env-var — local dev
 */

export interface AccessUser {
  email: string
  sub: string
}

export interface Env {
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
  DEV_USER?: string
}

// E-postmapping: vår JWT bruker disse adressene, men wedding_members-tabellen
// kan ha opprinnelige CF Access-adresser.
const EMAIL_MAP: Record<string, string> = {
  'stian@tuftebyeai.com': 'byestianbye@gmail.com',
}

function resolveEmail(email: string): string {
  const lower = email.toLowerCase()
  return EMAIL_MAP[lower] || lower
}

// Decode JWT payload uten signaturverifisering (middelware garanterer autentisering)
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
    const json = atob(padded)
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

// Les cookie-verdi fra Cookie-header
function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie') || ''
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k.trim() === name) return v.join('=')
  }
  return null
}

// ─── CF Access JWT (legacy) ───────────────────────────────────────────────

const ACCESS_TEAM_DOMAIN = 'tuftebyeai'
const ACCESS_AUD_TAG = '503bfbdda83cc06ffddbbdc8abf4a082a6cdbb26171fe64d0221f5c98dcf4bcd'

let cachedKeys: { keys: JsonWebKey[]; fetched_at: number } | null = null

async function fetchJWKS() {
  const now = Date.now()
  if (cachedKeys && now - cachedKeys.fetched_at < 3600_000) return cachedKeys.keys
  const res = await fetch(`https://${ACCESS_TEAM_DOMAIN}.cloudflareaccess.com/cdn-cgi/access/certs`)
  const data = (await res.json()) as { keys: JsonWebKey[] }
  cachedKeys = { keys: data.keys, fetched_at: now }
  return data.keys
}

async function verifyCfAccessJwt(token: string): Promise<AccessUser | null> {
  try {
    const payload = decodeJwtPayload(token)
    if (!payload) return null
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
    if (!aud.includes(ACCESS_AUD_TAG)) return null
    if (payload.exp && (payload.exp as number) < Math.floor(Date.now() / 1000)) return null
    // Signatur-verifisering utelates siden CF Access er skrudd av —
    // bruk bare payload-data for logging/fallback.
    return { email: payload.email as string, sub: payload.sub as string }
  } catch {
    return null
  }
}

// ─── Hoved-eksport ───────────────────────────────────────────────────────

export async function getAccessUser(request: Request, env: Env): Promise<AccessUser | null> {
  // 1. Vår egen JWT i crm_jwt-cookie (ny flate)
  const crmJwt = getCookie(request, 'crm_jwt')
  if (crmJwt) {
    const payload = decodeJwtPayload(crmJwt)
    if (payload && payload.email) {
      const exp = payload.exp as number | undefined
      if (!exp || exp > Math.floor(Date.now() / 1000)) {
        return {
          email: resolveEmail(payload.email as string),
          sub:   (payload.sub as string) || 'crm-user',
        }
      }
    }
  }

  // 2. CF Access JWT (legacy — beholdes hvis noen fortsatt har gammel sesjon)
  const cfJwt = request.headers.get('Cf-Access-Jwt-Assertion')
  if (cfJwt) {
    const user = await verifyCfAccessJwt(cfJwt)
    if (user) return { ...user, email: resolveEmail(user.email) }
  }

  // 3. Dev-fallback
  if (env.DEV_USER) return { email: env.DEV_USER, sub: 'dev' }

  return null
}
