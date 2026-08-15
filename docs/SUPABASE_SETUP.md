# Supabase setup for FarmOrb (crops-first)

## Local (recommended)

Ports are offset from the default `54321+` range so FarmOrb can run alongside other local Supabase projects (e.g. mediops).

```bash
cd farmorb_web
supabase start
cp .env.example .env.local
```

Then set `.env.local` from `supabase status`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54421
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase status>
```

Useful URLs after start:

| Service | URL |
|--------|-----|
| API | http://127.0.0.1:54421 |
| Studio | http://127.0.0.1:54423 |
| Mailpit | http://127.0.0.1:54424 |
| DB | postgresql://postgres:postgres@127.0.0.1:54422/postgres |

Migrations under `supabase/migrations/` apply automatically on `supabase start`.

Email confirmations are **disabled** locally (`enable_confirmations = false`) so signup returns a session immediately (needed for Cypress).

```bash
npm run dev
# in another terminal:
npx cypress run --spec "cypress/e2e/signup.cy.ts,cypress/e2e/crops.cy.ts"
```

## Cloud project

1. Create/link a project at https://supabase.com
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Apply `supabase/migrations/20260307140000_profiles_farms_crops.sql` (SQL editor or `npx supabase db push`)

This creates profiles, farms/members, crop types/varieties, grow locations, plantings, cycles, harvests, RLS, and RPCs `create_farm` / `create_planting_with_cycle`.

## Auth settings (cloud)

Enable Email provider. For easier local-like testing you can disable “Confirm email”.

## Smoke path

Create a crop farm → Crops → Locations → Plantings → Harvests.
