# Supabase setup for FarmOrb

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
npx cypress run
```

## Cloud project

1. Create/link a project at https://supabase.com
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Apply everything under `supabase/migrations/` in filename order (SQL editor or `npx supabase db push`)

| Migration | Creates |
|---|---|
| `20260307140000_profiles_farms_crops.sql` | profiles, farms/members, crop types/varieties, grow locations, plantings, cycles, harvests; RPCs `create_farm`, `create_planting_with_cycle` |
| `20260807150000_farm_invitation_rpcs.sql` | invite / accept / decline / list invitation RPCs |
| `20260815120000_livestock.sql` | animals, groups, memberships, movements, measurements, health records + schedules, breeding, suppliers, inventory, feeding, audit logs |

## Auth settings (cloud)

Enable Email provider. For easier local-like testing you can disable “Confirm email”.

## Notes on the livestock schema

- **Audit logs are written by triggers**, not by application code. Every audited table
  has an `AFTER INSERT OR UPDATE OR DELETE` trigger that records the actor (`auth.uid()`),
  a computed diff, and the entity type the activity tab filters on. An update that only
  touches `updated_at` is not recorded. Because the database cannot see the HTTP request,
  `ip_address`, `user_agent`, and `request_id` are always `NULL` — the Go middleware used
  to fill those in.
- **Stock levels are maintained by a trigger.** Inserting an `inventory_transactions` row
  adjusts `inventory_items.quantity`; do not adjust it by hand as well.
- **`inventory_items.is_low_stock` is a generated column**, because PostgREST cannot
  compare `quantity` against `low_stock_threshold` in a filter.
- **Grants are explicit.** RLS narrows which rows a query may touch, but `authenticated`
  still needs the table privilege underneath. New tables must be granted, or every query
  fails with `permission denied`.

## Smoke path

Crops: create a crop farm → Crops → Locations → Plantings → Harvests.

Livestock: create a livestock farm → Groups → Animals → Health → Breeding → Inventory →
Feeding, then check the Activity tab for the audit trail.
