// CF Access JWT-verifisering + dev-fallback
// Mønster gjenbrukt fra TufteBye CRM worker

const ACCESS_TEAM_DOMAIN = 'tuftebyeai'
const ACCESS_AUD_TAG = '503bfbdda83cc06ffddbbdc8abf4a082a6cdbb26171fe64d0221f5c98dcf4bcd'

interface JWKS_Key {
  kid: string
  kty: string
  alg: string
  use: string
  n: string
  e: string
}

let cachedKeys: { keys: JWKS_Key[]; fetched_at: number } | null = null

async function fetchJWKS(): Promise<JWKS_Key[]> {
  const now = Date.now()
  if (cachedKeys && now - cachedKeys.fetched_at < 60 * 60 * 1000) {
    return cachedKeys.keys
  }
  const res = await fetch(`https://${ACCESS_TEAM_DOMAIN}.cloudflareaccess.com/cdn-cgi/access/certs`)
  const data = (await res.json()) as { keys: JWKS_Key[] }
  cachedKeys = { keys: data.keys, fetched_at: now }
  return data.keys
}

function base64UrlToUint8Array(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export interface AccessUser {
  email: string
  sub: string
}

async function verifyJWT(token: string): Promise<AccessUser | null> {
  try {
    const [headerB64, payloadB64, sigB64] = token.split('.')
    if (!headerB64 || !payloadB64 || !sigB64) return null

    const header = JSON.parse(new TextDecoder().decode(base64UrlToUint8Array(headerB64)))
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToUint8Array(payloadB64)))

    // Sjekk aud
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
    if (!aud.includes(ACCESS_AUD_TAG)) return null

    // Sjekk exp
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null

    // Sjekk signatur mot JWKS
    const keys = await fetchJWKS()
    const jwk = keys.find((k) => k.kid === header.kid)
    if (!jwk) return null

    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      jwk as unknown as JsonWebKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`)
    const sig = base64UrlToUint8Array(sigB64)
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, sig, data)
    if (!ok) return null

    return { email: payload.email as string, sub: payload.sub as string }
  } catch (e) {
    console.error('JWT-verifisering feilet:', e)
    return null
  }
}

const ALLOWED_EMAILS = new Set([
  'byestianbye@gmail.com',
  'stian@tuftebyeai.com',
  'laila@tuftebyeai.com',
])

export async function getAccessUser(request: Request, env: Env): Promise<AccessUser | null> {
  // 1. CF Access JWT (produksjon)
  const jwt = request.headers.get('Cf-Access-Jwt-Assertion')
  if (jwt) {
    const user = await verifyJWT(jwt)
    if (user && ALLOWED_EMAILS.has(user.email.toLowerCase())) {
      return user
    }
    return null
  }

  // 2. Dev-fallback: hvis ENV.DEV_USER er satt, godta uten JWT
  // Settes via .dev.vars eller wrangler.toml lokalt
  if (env.DEV_USER) {
    return { email: env.DEV_USER, sub: 'dev' }
  }

  return null
}

export interface Env {
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
  DEV_USER?: string
}
