# Crop Module Review — Mango Lifecycle Readiness

**Date:** 2026-08-15
**Assessed against:** schema at commit `8e909b6` (23 tables, 3 migrations), the four panels in `src/components/crops/`, and `docs/FARMBRITE_ANALYSIS.md`
**Question:** can FarmOrb run a full commercial mango lifecycle today?

> Coverage below reflects what is **recordable in the database**, not what is planned in the PRD.

---

## Verdict: not yet, and one blocker is structural

The crop module records **what you planted and what you picked**. A mango operation also needs
what it *cost*, what it *sold for*, what *attacked the trees*, and how it *repeats every year for
two decades*. Three of those are unbuilt. The fourth is a schema decision that models regrowth
cycles for pineapple rather than bearing seasons for a tree.

| | Count |
|---|---|
| Stages supported | 3 |
| Partial | 2 |
| Not tracked | 6 |
| Schema-blocked | 1 |

---

## The lifecycle, stage by stage

| # | Stage | When | State | Notes |
|---|---|---|---|---|
| 1 | Block layout & land prep | Year 0 | Partial | `grow_locations` already has `gps_latitude`, `gps_longitude`, `boundary_coordinates` (JSONB), `soil_type`, `soil_ph`, `irrigation_type`, `parent_location_id`. The panel collects name, size, type. No map. |
| 2 | Planting grafted seedlings | Year 0 | Supported | `plantings` covers location, crop, variety, date, area, plant count. But `planting_method` has no **graft** option — how essentially all commercial mango is established. |
| 3 | Establishment — irrigation, fertilising, formative pruning | Years 1–3 | Not tracked | No field-operations table at all. PRD §9 specifies it; nothing built. The most expensive phase before first fruit leaves no record. |
| 4 | Disease & pest management | Continuous | Not tracked | No scouting, incidence or spray record. `health_records` is livestock-only — FKs are `animal_id`/`group_id`. No spray log ⇒ no pre-harvest-interval tracking. |
| 5 | Flower induction & flowering | Year 3+, annual | Not tracked | Paclobutrazol induction is the most consequential decision of the mango year. `plantings.status` has `flowering`/`fruiting`, but as current state, not dated history. |
| 6 | Fruit set, thinning, bagging | Annual | Not tracked | Bagging drives grade and fruit-fly control and is a major labour line. |
| 7 | Harvest & grading | Annual | **Supported** | Strongest part of the module. `harvests` records quantity, unit, `average_fruit_weight_kg`, `average_brix`, `labor_hours`, and an export-oriented `quality_grade` (export_a/b, local_a/b, processing, reject). |
| 8 | Post-harvest — treatment, ripening, storage | Post-harvest | Partial | `destination` and `storage_location_id` exist. No storage lots, movements or losses, so stored quantity is never tracked. |
| 9 | Sales, customers, traceability | Annual | Not tracked | No sales, customers, orders or lots. Quantity recorded; price never. PRD §12 designed this. |
| 10 | Repeating the bearing year for decades | Year 2 → 20+ | **Blocked** | See blocker 1. |
| 11 | Cost, revenue, ROI per block | Throughout | Not tracked | No cost/price/revenue column in any crop table. |

---

## The four blockers

### 1. The cycle model cannot express a mango year

```sql
planting_cycles.cycle_type  CHECK IN ('mother', 'ratoon')
harvests.harvest_type       CHECK IN ('mother','ratoon_1','ratoon_2',
                                      'ratoon_3','ratoon_4','partial','final')
create_planting_with_cycle() → INSERT cycle_number 1, cycle_type 'mother'
```

Correct for pineapple, sugarcane or banana — a plant regrows a fixed number of times and yield
declines toward a replant decision. A mango tree does not ratoon; it flowers and fruits annually,
effectively indefinitely. **By year five you have exhausted `ratoon_4` and cannot record the
year-twelve crop at all.** Falling back to `partial`/`final` discards season identity, which is
exactly what year-on-year comparison depends on.

The PRD names mango as a perennial tree crop in §8, but only the ratoon half was built.

**Fix:** add a `season` cycle type with a season year; let perennial plantings accumulate cycles
without an upper bound. `yield_decline_percent` and `continue_ratoon` stay meaningful for ratoon
crops and go unused for trees. Cheap now, expensive after real data exists.

### 2. There is no money anywhere in the crop module

Costs exist only on the livestock side (`health_records.cost`, `feeding_records.cost`,
`inventory_items.cost_per_unit`, `inventory_transactions.cost`). No crop table has a financial
column, and no expense/income/sale/invoice table exists. **Zero of 23 tables are financial.**

The project's own Farmbrite analysis rates accounting *HIGH — essential for farm profitability*.
For a crop with a three-year cost hole before first revenue, per-block cost accumulation is the
reason to keep records at all.

### 3. Plant protection has no home

`health_records` keys to animals and groups; `record_type` is constrained to
treatment/vaccination/inspection/injury/note. There is no planting or location FK to attach a
scouting observation or spray to.

Beyond disease history: without dated applications you cannot compute pre-harvest intervals, so
you cannot demonstrate residue compliance for export — and the harvest grading already built is
explicitly export-shaped.

### 4. Field operations are entirely unrecorded

Irrigation, fertigation, pruning, induction, thinning, bagging, weeding — no table. This is
blocker 3 from the other side, and it starves the financials: without operations there are no
labour hours and no input consumption, so per-block cost can never be built up even after an
expense table exists.

---

## What is already right — protect in any rework

- **Export-grade harvest capture** — brix, average fruit weight, six-level grade separating export A/B from local A/B. Most tools record a single weight.
- **Locations are already spatial** — GPS, JSONB boundaries, soil type and pH, irrigation type, block→plot nesting. Land plotting is a UI project, not a schema project.
- **Phenology in planting status** — `establishing`, `vegetative`, `flowering`, `fruiting`, `harvesting` map cleanly onto the mango year.
- **`perennial` is a first-class growing type**, alongside `months_to_first_harvest`.
- **RLS throughout** — multi-farm and team access enforced in the database, not the client.

---

## Against Farmbrite

| Capability | FarmOrb today | State |
|---|---|---|
| Crop planning & records | Crop library, locations, plantings, harvests | Partial |
| Farm accounting | Nothing — no financial table exists | Missing |
| Farm mapping | Coordinates stored, no map UI | Partial |
| Input & activity tracking | Nothing for crops | Missing |
| Yield projections & ROI | Expected-yield fields only | Missing |
| Tasks & work management | No task table | Missing |
| Reports & analytics | Dashboard still shows template demo data | Missing |
| Weather & climate | Not started | Missing |
| Orders & eCommerce | Not started | Missing |
| Inventory & suppliers | Built, livestock-oriented; reusable for crop inputs | Present |
| Livestock management | Animals, groups, health, breeding, feeding | Present |
| Audit trail | Database triggers on every audited table | Present |

---

## Suggested build order

Sequenced so each step enables the next, rather than by feature appeal.

1. **Unblock perennial cycles.** Add `season` cycle type + season year; drop the ratoon ceiling on `harvest_type`. Smallest change, largest consequence. Do it before anyone enters real data.
2. **Crop activities.** One table covering irrigation, fertilisation, spray, pruning, induction, thinning, bagging, weeding — date, planting/location, inputs, quantity, labour hours. This is the spine; plant protection and cost accounting both hang off it.
3. **Money.** Expenses and sales attributable to farm/location/planting/cycle. Fed by activities (labour, inputs) and harvests (revenue). Only then can you show cost per kilo and per-block ROI.
4. **Fill in the crop UI.** The panels expose a fraction of the schema — the crop library collects name/type/category while the table also holds spacing, density, expected yield and ratoon settings. Cheapest quality win; no migration.
5. **Land plotting.** Draw a boundary, save to `boundary_coordinates`, colour blocks by crop or status. Most visible per unit of work, but earns less than the four above.

---

*Companion document: [FARM_DOMAIN_MAP.md](./FARM_DOMAIN_MAP.md) — the full capability map and crop reference-data plan.*
