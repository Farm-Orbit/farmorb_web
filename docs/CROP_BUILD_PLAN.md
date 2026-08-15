# Crop Module Build Plan

**Date:** 2026-08-15
**Scope:** the five blockers from [CROP_MODULE_REVIEW.md](./CROP_MODULE_REVIEW.md), designed as
flows and broken into tasks.
**Sequencing:** each epic unblocks the next. CR-1 should land before any real crop data exists.

Estimates are rough developer-days for one person already familiar with the codebase, excluding
review and QA.

---

## Part 1 — How data entry has to feel

Read this before the epics. Farm records are made standing in a block, on a phone, often with one
hand and gloves on, at the end of a long day. **The quality of the database is decided entirely by
how cheap it is to add a row.** A schema that captures everything behind a form nobody finishes
produces worse data than a crude one people actually use.

Every task in Part 2 is designed against these seven rules. Where a rule drove a specific
decision, it is cited as (UX-n).

### UX-1 · Context flows down; never ask what the screen already knows

The natural way to build this is a form with Farm → Block → Planting → Cycle selects. That is four
decisions before the user has said anything about what they did, repeated on every single entry.

Context must be inherited from wherever the action was launched. Logging from a planting page
prefills the planting *and* its farm *and* its active cycle. Only the genuinely ambiguous field is
ever shown as a choice, and it is shown as an editable chip ("Block 4 ✕"), not an empty dropdown.

### UX-2 · One event, one entry

A spray consumes stock. A harvest creates sellable quantity. A crew's hours are a labour cost.
If the user has to log the operation *and then* log the inventory movement *and then* log the
expense, two of those three will not happen and the numbers will disagree.

Log the real-world event once; let the database derive the consequences. This is why stock
adjustment is a trigger (CR-2.5) and expenses are derived (CR-3.5), not a second form.

### UX-3 · Batch is the default, not a power feature

Nobody sprays one block. A crew treats the whole orchard, and a picker fills crates from several
blocks in a morning. A one-record-per-form design silently means "fill this in eleven times".

Targets are multi-select everywhere. One spray across six blocks is one entry that writes six
rows — and reads back as one action, not six.

### UX-4 · Repeat is a first-class action

Most field operations are near-identical to the last one. "Repeat" on any past activity, opening
a prefilled form with today's date, removes most typing from routine work. Spray programmes go
further: a saved template with product, rate and interval.

### UX-5 · Progressive disclosure driven by type

A compliant spray record needs about fifteen fields. An irrigation needs three. Showing the spray
form for every activity type is how you teach people to abandon the form.

Show the fields the chosen type actually requires. Everything else lives behind "More details",
collapsed by default, and remembers whether the user opened it last time.

### UX-6 · Defaults from reference data and from history

The crop type knows its spacing. The product knows its rate and pre-harvest interval. The user
knows what unit they used last time. Prefill all of it and let them correct — and never make them
do arithmetic the app can do (area × rate = quantity, crates × weight = kilos).

This is the payoff from the reference-data work in [FARM_DOMAIN_MAP.md](./FARM_DOMAIN_MAP.md) §3.

### UX-7 · Speak the grower's language

The schema says `grow_location`, `planting_cycle`, `cycle_type`. A grower says block, season,
harvest. Nobody should ever be asked to pick a "cycle type". If the software knows a mango
planting is in its fourth bearing year, it says "2029 season" and selects it.

### The flows this produces

Three journeys carry almost all the volume. They are specified with their epics, but the shape is:

| Flow | Frequency | Target | Design consequence |
|---|---|---|---|
| Log an activity | Daily, per crew | Under 20 seconds | Global quick-log, context prefilled, batch targets, repeat |
| Record a harvest | Many times daily in season | Under 15 seconds | Cycle auto-selected, multi-grade rows in one form, running total |
| Set up a planting | Once per block per cycle | Thoroughness over speed | Reference-data prefill, optional detail collapsed |

**A global "Log" action** belongs in the header next to search — reachable from anywhere, so
recording never begins with navigation. On mobile it is a floating button. This is a small piece
of work that changes the feel of the whole product, and it is CR-2.9.

---

## Part 2 — Conventions

Not optional — the first three are how the existing schema works, and breaking them produces
failures that look like application bugs.

1. **Pre-launch: amend the base migrations, don't patch them.** Nothing is live — the three
   existing migrations have only ever been applied to local stacks. So schema corrections are
   made *in* `20260307140000` / `20260807150000` / `20260815120000` followed by
   `supabase db reset`, not as a stack of `ALTER TABLE` files patching a schema that never
   shipped. Anyone with a local stack resets; that is the whole cost.

   **The cutoff is the first cloud environment holding data you would be sad to lose.** From that
   moment this rule inverts permanently: additive migrations only, never edit a shipped file.
   Write that date down when it happens.
2. **Every new table needs three things:** RLS policies (`is_farm_member` / `is_farm_owner`), an
   explicit `GRANT ... TO authenticated`, and an audit trigger in the `record_audit_log` loop. A
   missing grant fails every query with `permission denied`, which reads like an RLS bug and is not.
3. **Invariants live in the database.** Follow `apply_inventory_transaction` — if a write must
   always have a side effect, make it a trigger, not service code (UX-2 depends on this).
4. **Test ids are namespaced.** `nav-*` for the sidebar, `tab-*` for animal/group sub-tabs. New
   panels get their own prefix.
5. **Use `@/components/form`.** The crop panels hand-rolled inputs and shipped an invisible-text
   dark-mode bug as a result.
6. **Run E2E against a production build**, not `next dev` — see `docs/SUPABASE_SETUP.md`.

---

## Part 3 — Epics

### CR-1 — Perennial bearing cycles

**Why first:** a mango tree bears annually for 20–40 years, but the model tops out at `ratoon_4`,
so by year five there is nowhere to put a harvest. Everything later attaches to cycles, so the
shape has to be right before the rest is built on top of it.

**What it involves:** the cycle number is currently denormalised into `harvests.harvest_type`
(`ratoon_1`, `ratoon_2`…), which is where the ceiling comes from. The cycle row already carries
`cycle_number`, so the fix is to stop encoding the same fact twice.

Because nothing is live, this is a **correction to the crops migration**, not a patch on top of
it — which means the redundancy goes away entirely rather than being frozen in place. A harvest
type should describe *the pick* (`partial`, `final`), while *which season or ratoon* it belongs
to comes from the cycle it references. That is the design we would have written first, and it is
free to adopt today.

#### Flow

Today the harvest form asks for a planting *and* a cycle — two selects for one fact, in schema
language (UX-1, UX-7). After this epic, choosing a planting resolves its active cycle silently.
Cycle only becomes visible when it is genuinely ambiguous, and then it reads "2027 season".

Advancing a season is an explicit action on the planting ("Start 2028 season") rather than a
field on a form, because it is a real event with a date, not an attribute.

| ID | Task | Est. | Depends |
|---|---|---|---|
| CR-1.1 | Amend the crops migration: add `'season'` to `planting_cycles.cycle_type`, add `season_year INTEGER`, and reduce `harvests.harvest_type` to `('partial','final')` — season and ratoon identity now come from the cycle. Also folds in `'graft'` on `plantings.planting_method` (was CR-4.1) | 0.75 | — |
| CR-1.3 | `create_planting_with_cycle` picks the first cycle from the crop's `growing_type` — perennial → `season` with year from planting date; ratoon/annual → `mother` | 0.5 | CR-1.1 |
| CR-1.4 | RPC `start_next_cycle(planting_id)` — creates cycle N+1, enforcing `max_ratoon_cycles` for ratoon crops, unbounded for perennials; closes the prior cycle | 0.5 | CR-1.3 |
| CR-1.5 | Season labelling helper — one place that turns a cycle row into "2027 season" / "Ratoon 2" / "Mother crop", used by every surface (UX-7) | 0.25 | CR-1.4 |
| CR-1.6 | Types + `plantingService.startNextCycle`; `listCycles` returns labels | 0.5 | CR-1.5 |
| CR-1.7 | UI: cycle timeline on a planting with yield per season, and a "Start next season" action | 1 | CR-1.6 |
| CR-1.8 | UI: remove the cycle select from the harvest form; resolve the active cycle from the planting and show it as an editable chip (UX-1) | 0.5 | CR-1.6 |
| CR-1.9 | Tests: SQL reaching season 12; E2E advancing three seasons and harvesting in the third | 0.5 | CR-1.8 |

**Acceptance:** a mango planting can record a harvest in its twelfth bearing year, attributable to
a named season with its own yield — and the person recording it never sees the word "cycle".

**Estimate: ~4.25 days** — and the sooner it happens the smaller it stays, since amending the base
migration stops being an option the moment a cloud environment holds real data.

---

### CR-2 — Crop activities and plant protection

**Why second:** it is the spine. Disease history, spray compliance and per-block cost all hang off
it — without operations there are no labour hours and no input consumption, so cost can never be
built from the ground even after CR-3 exists.

**What it involves:** one activity table for all field operations, a separate observation table for
scouting (severity and incidence, not inputs and rates), and pre-harvest interval as a rule the
software enforces rather than a note someone remembers.

#### Flow — logging a spray

The compliance-heaviest and highest-volume entry in the product. Designed target: **under 20
seconds for a repeat spray**.

1. **"Log" from anywhere** — header action, or the floating button on mobile. No navigation first.
2. **Pick "Spray".** The form shows only spray fields (UX-5). Everything non-essential is collapsed.
3. **Targets are chips, multi-select, prefilled** from wherever you launched. Standing on Block 4,
   it says "Block 4 ✕" with an add control. Spraying the whole orchard is "Select all" (UX-3).
4. **Product search hits inventory**, and selecting it pulls default rate, unit, PHI and REI from
   the product record (UX-6). No typing an active ingredient from a label.
5. **Quantity computes itself** from rate × total target area, showing the stock consequence
   inline — "uses 18 L, leaves 12 L" (UX-6). No calculator.
6. **Save writes one activity row per target plus one inventory transaction** (UX-2), and confirms
   with the thing the grower actually needs: **"Earliest harvest: 12 September"**.
7. **"Repeat"** on any past spray reopens this prefilled with today's date (UX-4).

#### Flow — scouting

Different shape and much lighter: what did you see, how bad, where, and a photo. The photo is the
record — most identification happens from the image, not the dropdown. Severity is a 3–5 point
scale with words, never a free number.

| ID | Task | Est. | Depends |
|---|---|---|---|
| CR-2.0 | **Spike: file storage.** Supabase Storage bucket + RLS policy + upload component. Nothing in the product stores files today, and scouting is worthless without photos | 1 | — |
| CR-2.1 | Migration: `crop_activities` — farm, planting/location/cycle, `activity_type` (irrigation, fertilisation, spray, pruning, induction, thinning, bagging, weeding, other), date, quantity + unit, labour hours, worker count, `performed_by`, notes | 1 | CR-1.1 |
| CR-2.2 | Migration: spray fields — product, active ingredient, rate + unit, water volume, equipment, weather at application, `phi_days`, `rei_hours` | 0.5 | CR-2.1 |
| CR-2.3 | Migration: `crop_observations` — planting/location, date, pest or disease, severity, incidence %, growth stage, notes, attachments | 0.5 | CR-2.1 |
| CR-2.4 | RLS + grants + audit triggers for both, per the livestock pattern | 0.5 | CR-2.3 |
| CR-2.5 | Trigger: an activity consuming an inventory item writes an `inventory_transactions` row, so stock decrements through the existing path (UX-2) | 0.5 | CR-2.1 |
| CR-2.6 | Function `earliest_safe_harvest_date(planting_id)` — max of (spray date + `phi_days`) over open sprays | 0.5 | CR-2.2 |
| CR-2.7 | Enforce PHI on harvest — block the write, naming the spray and the date rather than warning | 1 | CR-2.6 |
| CR-2.8 | Services, slice and hooks for activities and observations | 1 | CR-2.4 |
| CR-2.9 | **Global quick-log** — header action and mobile floating button, type picker, context inheritance (UX-1). Reused by harvests in CR-1.8 and observations | 1.5 | CR-2.8 |
| CR-2.10 | Type-driven activity form with progressive disclosure and remembered expansion (UX-5) | 1.5 | CR-2.9 |
| CR-2.11 | Multi-select target chips with "select all in farm", writing N rows from one submission (UX-3) | 1 | CR-2.10 |
| CR-2.12 | Product picker sourcing rate/PHI/REI from inventory; auto-computed quantity with live stock impact (UX-6) | 1 | CR-2.10 |
| CR-2.13 | "Repeat" action on any activity, and saved spray programme templates (UX-4) | 1 | CR-2.10 |
| CR-2.14 | Activity timeline per farm and per planting — grouped by day, filterable by type, showing batch entries as one action not six (UX-3) | 1.5 | CR-2.10 |
| CR-2.15 | Scouting form with photo upload and worded severity scale | 1 | CR-2.0, CR-2.8 |
| CR-2.16 | Tests: SQL for PHI and the stock trigger; E2E logging one spray across three blocks then being blocked from harvesting inside the interval | 1 | CR-2.14 |

**Acceptance:** one spray logged across six blocks in under 20 seconds decrements stock once,
writes six attributable records, and refuses a harvest inside the interval with the reason.

**Estimate: ~14.5 days**

---

### CR-3 — Costs and revenue

**Why third:** it needs CR-2 to have anything to cost. Building expenses first produces a ledger
someone fills in by hand — exactly what farm software is meant to remove.

**What it involves:** expenses attributable at four levels (farm, location, planting, cycle) so a
cost is as specific as it genuinely is, sales attributable back to a harvest, and two derived
numbers that matter — cost per kilo and gross margin per block. Both are rollups, so they belong
in database views, not client arithmetic.

#### Flow

**Most expenses should never be typed.** Labour hours from activities and input consumption from
inventory become expenses automatically (UX-2). Manual entry is only for costs with no operational
trace — land rent, fuel, repairs, certification fees.

Derived and manual entries must be **visually distinct** in the ledger, and a derived row links
back to the activity that produced it. If growers cannot see where a number came from they will
not trust the margin, and an untrusted margin is not used.

Recording a sale starts from the harvest, not from a blank invoice: "Sell from this harvest" with
the available quantity shown, so the sold quantity can never exceed what was picked.

| ID | Task | Est. | Depends |
|---|---|---|---|
| CR-3.1 | Decide currency handling — recommend a single `currency` on `farms`, no multi-currency yet; document it | 0.25 | — |
| CR-3.2 | Migration: `expense_categories` (seeded) and `expenses` — date, category, amount, supplier, description, allocation target, optional `crop_activity_id` / `inventory_transaction_id` links, `is_derived` flag | 1 | CR-3.1 |
| CR-3.3 | Migration: `sales` — date, channel (export / wholesale / farm gate / processing), customer, harvest link, quantity, unit, unit price, total | 1 | CR-3.1 |
| CR-3.4 | RLS + grants + audit triggers | 0.5 | CR-3.3 |
| CR-3.5 | Derive expenses from activities (labour hours × rate) and inventory (quantity × `cost_per_unit`) (UX-2) | 1 | CR-3.2, CR-2.5 |
| CR-3.6 | Views: cost per planting and per cycle, revenue per planting, **cost per kg**, gross margin per block | 1 | CR-3.5 |
| CR-3.7 | Services + slice for expenses and sales | 1 | CR-3.4 |
| CR-3.8 | UI: expense ledger distinguishing derived from manual, with links back to source activities | 1.5 | CR-3.7 |
| CR-3.9 | UI: "Sell from harvest" flow, constrained by available quantity | 1 | CR-3.7 |
| CR-3.10 | UI: margin summary per block — cost per kg, revenue, margin, season-over-season column | 1 | CR-3.6, CR-3.8 |
| CR-3.11 | Tests: SQL for rollups against fixtures; E2E from activity → derived expense → margin | 1 | CR-3.10 |

**Acceptance:** for a mango block you can answer "what did a kilo cost me this season, and did the
block pay" without leaving the app — and trace any number back to the event that created it.

**Out of scope:** payroll, tax reporting, accounting export, budgets, cash flow, depreciation.
Note that **a perennial planting is a capital asset** — establishment cost should eventually
amortise across the bearing life rather than hit year one. Not this epic, but do not model
expenses in a way that forecloses it.

**Estimate: ~10.5 days**

---

### CR-4 — Fill in the crop UI

**Why fourth:** no migration and no new concepts, so anyone can pick it up and it parallelises
with CR-2 or CR-3. The panels expose a fraction of what the schema stores.

**What it involves:**

| Panel | In the schema, not in the UI |
|---|---|
| Crop library | `scientific_name`, `months_to_first_harvest`, row/plant spacing, `plants_per_hectare`, `expected_yield_per_hectare`, `supports_ratoon`, `max_ratoon_cycles`; variety `months_to_maturity`, `expected_yield`, `characteristics` |
| Locations | `location_type`, parent location, acres, GPS, `soil_type`, `soil_ph`, `irrigation_type`, `status`, `notes` |
| Plantings | `planting_method`, `material_type`, `material_source`, `source_planting_id`, `area_hectares`, `plant_density`, `expected_harvest_date`, `notes` |
| Harvests | `average_fruit_weight_kg`, `average_brix`, `quality_grade`, `destination`, `storage_location_id`, `labor_hours`, `notes` |

#### Flow

These are **setup** forms, done once per block or crop, so thoroughness beats speed — with one
exception. Harvest is high-frequency and time-pressured, so it must not grow into a twelve-field
form just because twelve columns exist.

The harvest fast path stays **quantity + grade**, with unit defaulting to the last used for that
crop (UX-6). Brix, fruit weight, destination and labour go behind "More details" (UX-5). Grade
splits are repeatable rows inside one form — "120 kg export A, 40 kg local B" is one submission
with a running season total, not two records requiring re-navigation (UX-3).

Setup forms should prefill from reference data once it exists: choosing Mango fills spacing,
months to first harvest and expected yield, leaving the grower to correct rather than research
(UX-6).

| ID | Task | Est. | Depends |
|---|---|---|---|
| CR-4.2 | Replace hand-rolled inputs across all four panels with `@/components/form`; retire `fieldStyles.ts` | 1 | — |
| CR-4.3 | Crop library: full crop-type and variety forms, optional detail collapsed | 1 | CR-4.2 |
| CR-4.4 | Locations: full form including parent location and soil | 1 | CR-4.2 |
| CR-4.5 | Plantings: full form including method, material and expected harvest | 1 | CR-1.1, CR-4.2 |
| CR-4.6 | Harvests: fast path plus multi-grade rows and running season total (UX-3, UX-5) | 1.25 | CR-4.2 |
| CR-4.7 | Extend `crops.cy.ts` over the added fields and the multi-grade path | 0.75 | CR-4.6 |

**Acceptance:** every column the crop schema stores is reachable, no crop panel declares its own
input classes, and recording a two-grade harvest is one submission.

**Estimate: ~6 days** (the `graft` migration moved into CR-1.1)

---

### CR-5 — Land plotting

**Why last of the five:** the most visible feature per unit of work, but it earns less than the
four above. The schema is ready — `boundary_coordinates`, `gps_latitude`, `gps_longitude` and
`parent_location_id` all exist and are unused.

#### Flow

The map is not only a viewer — it is the fastest **selector** the product can have. Picking blocks
by tapping them on a map beats a list of names for anyone who thinks spatially, which is most
growers. Wiring the map into the CR-2.11 target picker is where it stops being decorative (UX-3).

Drawing a boundary should derive the area rather than asking for it (UX-6); a grower knows the
shape of the block far better than its hectares.

| ID | Task | Est. | Depends |
|---|---|---|---|
| CR-5.1 | Choose map library and tiles. Recommend Leaflet + OpenStreetMap — no key, no per-view billing. Confirm bundle size and SSR under Next 15 | 0.5 | — |
| CR-5.2 | Farm map from `boundary_coordinates`, coloured by status | 1 | CR-5.1 |
| CR-5.3 | Draw and edit boundary polygons, persisted as GeoJSON | 1.5 | CR-5.2 |
| CR-5.4 | Derive area from polygon, prefill `size_hectares` / `size_acres`, manual override (UX-6) | 0.5 | CR-5.3 |
| CR-5.5 | Colour blocks by current crop; click through to the planting | 1 | CR-5.2, CR-4.4 |
| CR-5.6 | Map as a target selector in the quick-log flow (UX-3) | 1 | CR-5.3, CR-2.11 |
| CR-5.7 | Optional: prefill soil type and pH from SoilGrids for a drawn boundary (UX-6) | 1 | CR-5.3 |
| CR-5.8 | Tests: E2E drawing a boundary, asserting persisted GeoJSON and derived area | 0.5 | CR-5.4 |

**Acceptance:** a grower draws their mango blocks, the drawn area becomes the recorded size, and
they can select spray targets by tapping blocks.

**Estimate: ~7 days**

---

## Part 4 — Summary

| Epic | Focus | Est. | Gate |
|---|---|---|---|
| CR-1 | Perennial bearing cycles | 4.25d | Cheapest while the base migrations can still be amended |
| CR-2 | Activities & plant protection | 14.5d | Includes the file-storage spike and the quick-log flow |
| CR-3 | Costs & revenue | 10.5d | Needs CR-2 for anything to cost |
| CR-4 | Crop UI depth | 6d | Parallelisable; no migration of its own |
| CR-5 | Land plotting | 7d | CR-5.6 needs CR-2.11 |

**~42 days sequential**, about 36 with CR-4 alongside CR-2 or CR-3.

CR-2 grew from 9 to 14.5 days when the flows were designed rather than the tables. That difference
is the actual product: the schema was always going to take a few days, and the reason farm software
gets abandoned is the other nine.

### The pre-launch window is an asset with an expiry

Nothing is live, so schema mistakes currently cost a `supabase db reset`. After the first cloud
environment holds real data they cost a migration, a backfill, and a rollback plan. Anything in
this plan that changes an existing table — CR-1.1 above all — is dramatically cheaper now than at
any later point, and that gap only widens.

Worth spending the window deliberately: get the shapes right while they are still free to change,
rather than deferring them because there is no visible pressure yet.

### Two decisions to take before CR-2, not during it

Both are expensive to retrofit and both are argued in [FARM_DOMAIN_MAP.md](./FARM_DOMAIN_MAP.md):

- **Units and currency.** Store canonical units, convert at the edges. Once activities, expenses
  and sales all carry quantities, changing this means migrating every number and every historical
  report.
- **Offline behaviour.** Not scheduled here, but it constrains form design. Write optimistically
  and treat the server round trip as confirmation rather than a gate, and the forms built in CR-2
  will survive an offline queue being added later. Build them assuming a live connection and they
  will all need rewriting.
