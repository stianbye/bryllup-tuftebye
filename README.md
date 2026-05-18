# Bryllup Laila & Stian — Bordplassering

Bordplasseringsverktøy bygd for bryllupet 22. august 2026. React + Tailwind + Cloudflare Pages + Supabase.

## Hurtigstart (lokalt)

```powershell
cd <prosjekt-mappa>
npm install
copy .env.local.example .env.local
# Lag også .dev.vars — se under
npm run dev
```

Appen kjører på http://localhost:5173 — men API-kallene vil 401 fordi Pages Functions ikke kjører i `npm run dev`. For å teste hele stacken lokalt: `npm run build` og `npx wrangler pages dev ./dist --port 8788`.

### .env.local (Vite-side, valgfri)

```
VITE_SUPABASE_URL=https://yukzyehkzovspbwqphmr.supabase.co
```

### .dev.vars (Pages Functions-side, påkrevd for API)

```
SUPABASE_URL=https://yukzyehkzovspbwqphmr.supabase.co
SUPABASE_SERVICE_KEY=<service_role-token fra Brukernavn og Passord.txt linje 28>
DEV_USER=byestianbye@gmail.com
```

`DEV_USER` overstyrer CF Access-sjekken lokalt.

## Arkitektur

```
Browser ──HTTPS──> Cloudflare Pages (bryllup.tuftebyeai.com)
                     │
                     ├── Static SPA (React + Tailwind + Vite)
                     │
                     └── Pages Functions (functions/api/*)
                            │
                            ├── Cf-Access-Jwt-Assertion (verifiser bruker)
                            └── Supabase REST (bryllup-skjema, service_role)
```

- **Auth**: Cloudflare Access JWT, allow-list `byestianbye@gmail.com`, `laila@tuftebyeai.com`, `stian@tuftebyeai.com`
- **Data**: Supabase prosjekt `yukzyehkzovspbwqphmr` (delt med CRM), egen `bryllup`-skjema
- **State**: Zustand-store. Refetch ved fokus + etter mutasjon (godt nok for 2 brukere)

## Datamodell (`bryllup`-skjema i Supabase)

| Tabell | Beskrivelse |
|--------|-------------|
| `weddings` | Hovedobjekt — 1 rad |
| `versions` | Versjon A/B/C av plasseringsforslag |
| `tables` | Bord i lokalet |
| `guests` | Stamdata + tags (gruppe, alder, partner_of, må/må-ikke-regler) |
| `assignments` | Gjest → bord per versjon |
| `wedding_members` | E-poster med tilgang |

## Smart logikk

- **Konfliktdeteksjon** (`src/lib/conflicts.ts`)
- **Anbefalingsmotor** (`src/lib/recommendations.ts`)
- **Auto-place** (`src/lib/auto-place.ts`)

## API-endepunkter

| Endpoint | Beskrivelse |
|----------|-------------|
| `GET /api/me` | Innlogget e-post |
| `GET /api/state` | Full bryllups-state |
| `POST /api/mutate` | Generelle mutasjoner |

## Deploy

### Engang-oppsett (Cl