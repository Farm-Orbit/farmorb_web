# Farm Management Domain Map & Crop Reference-Data Plan

**Date:** 2026-08-15
**Status assessed against:** schema at commit `8e909b6` (23 tables, 3 migrations)
**Purpose:** the full capability surface of a serious farm platform — beyond Farmbrite — with
FarmOrb's position marked, the requirements that are easy to not know you need, and a concrete
plan for shipping crop reference data.

**Current coverage: 13 of 73 capabilities built.**

---

## 1. The domain map

Farmbrite covers roughly the first nine domains. The last three are where most tools are weak
and where an operation actually feels the pain.

### Land & spatial — 2/7
| Capability | State |
|---|---|
| Location hierarchy (farm → block → plot) | Built |
| Boundary polygons & area from geometry | Partial — columns exist, no map UI |
| Soil tests as a time series | Missing |
| Field & rotation history | Missing |
| Irrigation infrastructure & zones | Missing |
| Water source, rights & metered usage | Missing |
| Land tenure / lease records | Missing |

### Crop reference data — 1/7
| Capability | State |
|---|---|
| Per-farm crop & variety library | Built |
| Global species reference | Missing — see §3 |
| Cultivar traits (maturity, rootstock, resistance) | Missing |
| Growth-stage models (BBCH) & degree-day bases | Missing |
| Nutrient removal rates per tonne yield | Missing |
| Crop coefficients (Kc) for irrigation | Missing |
| Known pests & diseases per crop | Missing |

### Planning — 0/5
Season/multi-year crop plan · rotation planning with agronomic constraints · yield & revenue
projection · input requirement forecast → purchasing · labour forecast & succession scheduling.

### Operations & work — 0/6
Field activity log · tasks (assignment, recurrence, completion) · crews & work orders · labour
time tracking **and piece rates** · machinery hours/maintenance/fuel · input batch numbers & expiry.

### Plant protection & compliance — 0/6
Scouting observations with severity · spray records (product, rate, operator, weather) ·
pre-harvest & re-entry interval enforcement · residue limits by destination market ·
certification evidence packs (organic, GlobalG.A.P., Fairtrade) · operator licences & chemical store register.

### Livestock — 6/7
| Capability | State |
|---|---|
| Animals & batch tracking | Built |
| Groups, membership, movements | Built |
| Health records & schedules | Built |
| Breeding & genealogy | Built |
| Feeding records | Built |
| Measurements & weights | Partial — table exists, no UI |
| Grazing & pasture rotation | Missing |

### Harvest & post-harvest — 1/5
| Capability | State |
|---|---|
| Harvest records with grading & quality | Built |
| Lot creation & traceability codes | Missing |
| Pack-house — grading, pack-out percentage | Missing |
| Storage lots, movements, shrinkage | Missing |
| Cold-chain monitoring | Missing |

### Sales & customers — 0/5
Customers, price lists, contracts · orders, deliveries, invoices · channels (export, wholesale,
farm gate) · subscriptions/CSA · revenue attribution back to block.

### Financials — 0/8
Expenses with categories · cost allocation to block/planting/cycle · cost per kg and per hectare ·
gross margin per enterprise · budget vs actual · cash-flow projection · **asset register &
depreciation** · accounting export (QuickBooks, Xero).

### Climate & environment — 0/5
Weather history & forecast per location · growing degree days & chill accumulation · frost/heat/
rainfall alerts · evapotranspiration irrigation scheduling · soil-moisture sensor ingest.

### Analytics & decisions — 0/5
Yield per hectare/tree/season · year-on-year comparison · replant vs retain decision support ·
block ranking & benchmarking · dashboard on real data (currently still template demo figures).

### Platform — 3/7
| Capability | State |
|---|---|
| Multi-farm with row-level security | Built |
| Team invitations & roles | Built |
| Audit trail | Built |
| Offline-capable mobile | Missing |
| Photo & document attachments | Missing |
| Units, currency & language localisation | Missing |
| Notifications & alerting | Missing |

---

## 2. Ten requirements that are easy not to know you need

These rarely appear on feature lists. Each is the difference between a system farmers try and a
system they keep — and most are architectural, not features to bolt on later.

1. **Offline mobile is the product, not a port.** Records are made in a field with no signal, on a
   phone, one-handed. If entry requires returning to an office it stops happening within a month
   and the database quietly becomes fiction. Constrains architecture (queued writes, conflict
   resolution) — decide early.
2. **Traceability is a chain, not a field.** Export and food-safety regimes require one-up/one-back:
   shipment → lot → harvest → block → sprays applied. Retrofitting is close to a rewrite of the
   harvest and sales path.
3. **Pre-harvest intervals should block, not warn.** Every pesticide has a legally mandated gap
   between application and harvest. Knowing both dates but not enforcing the gap hands a grower
   documented evidence of a violation.
4. **Field history outlives the planting.** What grew in a block three seasons ago governs what is
   safe now — soil-borne disease, nutrient carry-over, herbicide residue. It belongs to the *land*,
   so it must survive plantings being deleted; a cascading delete can silently destroy it.
5. **Soil tests are a time series.** A single `soil_ph` column answers "what is the pH". The useful
   question is "which way is it moving, and did the lime work".
6. **Harvest weight is not sellable weight.** Fruit is graded, rejected, damaged and shrinks between
   picking and selling. Pack-out percentage is a headline metric and needs picked and packed as
   separate records.
7. **Labour is usually paid by the piece.** Harvest crews are paid per crate or kilo, not per hour.
   A time-only model cannot produce payroll — and payroll is why a manager opens the app daily.
8. **A perennial planting is a capital asset.** Three years of mango establishment is investment
   amortised across a twenty-year bearing life, not a year-one expense. Book it as running cost and
   early years look catastrophic while later years look unrealistically profitable.
9. **Units and currency are structural.** Acres and hectares, kilos and pounds, crates whose weight
   differs by farm. Store canonical units, convert at the edges. Retrofitting means migrating every
   number and every historical report.
10. **Photographs are the field record.** A photo of a diseased leaf is how the problem gets
    diagnosed and how a lesion is compared week to week. There is currently no file storage at all.

---

## 3. Crop reference-data plan

Copy data into our own database rather than depending on a live API. Every candidate source is
either a slow-moving reference dataset or a volunteer-funded service — neither should need to be
reachable for a farmer to record a planting.

### Two tiers, with copy-on-use

Ship a **global reference library**, read-only to farms, separate from the **per-farm library**
that already exists. When a grower picks "Mango — Kent", copy the row into their `crop_types` /
`crop_varieties` with a `reference_id` pointing home. They can then adjust spacing or yield for
their own conditions without mutating global data, and provenance survives for later updates.

```
-- global, shipped via migration, read-only to farms
reference_crops         id, common_name, scientific_name, family, category,
                        growing_type, months_to_first_harvest, bearing_years,
                        spacing_row_m, spacing_plant_m, plants_per_hectare,
                        expected_yield_t_ha, temp_min_c, temp_max_c,
                        rainfall_min_mm, rainfall_max_mm, ph_min, ph_max,
                        source, source_ref, licence

reference_varieties     id, reference_crop_id, name, synonyms[],
                        months_to_maturity, rootstock, traits jsonb, source

reference_growth_stages id, reference_crop_id, scale ('BBCH'), code, name,
                        typical_days_after_planting

reference_pests         id, eppo_code, common_name, scientific_name, type
reference_crop_pests    reference_crop_id, reference_pest_id, prevalence

-- per-farm tables gain provenance
crop_types.reference_id     → reference_crops.id
crop_varieties.reference_id → reference_varieties.id
```

### Sources

Availability verified 2026-08-15. **Licence terms were not verified and must be reviewed before
redistributing any dataset inside the product.**

| Source | Gives us | Access | Notes |
|---|---|---|---|
| [FAO ECOCROP](https://gaez.fao.org/pages/ecocrop) | Environmental envelopes for 2,000+ species — temperature, rainfall, pH, soil, altitude, photoperiod | Bulk download via FAO data catalogue | Best single seed for `reference_crops` |
| [EPPO Global Database](https://data.eppo.int/apis/) | 1,900+ pests/diseases with host links, distribution, stable EPPO codes | REST API, free account + Open Data Licence token; also bulk SQL/XML/JSON | Seeds `reference_pests` and the crop↔pest join |
| [Genesys PGR](https://www.genesys-pgr.org/documentation/apis) | Cultivar/accession passport data from global genebanks; BrAPI endpoints | Open JSON API, sandbox available | Genebank-oriented — expect accessions more than commercial cultivars |
| [USDA GRIN](https://www.grin-global.org/) | Taxonomic backbone, common-name synonymy | Free; underpins Genesys taxonomy | Use for canonical names so sources reconcile |
| FAO Irrigation & Drainage Paper 56 | Crop coefficients (Kc), stage lengths, rooting depths | Published document — transcribe | Standard basis for ET irrigation scheduling |
| BBCH scales | Standard phenological growth stages | Published — encode by hand | No API. Mango has its own published scale |
| [Trefle](https://trefle.io/) | Aggregated plant API (USDA + GBIF + OpenFarm) | Free API key | Live but donation-funded. Seed from it; do not call at runtime |
| [SoilGrids](https://soilgrids.org/) | Modelled soil properties at any coordinate | Free REST API (ISRIC) | Pairs with land plotting — prefill soil for a drawn block |
| [Open-Meteo](https://open-meteo.com/) / NASA POWER | Historical & forecast weather, agroclimatology | Free, no key (Open-Meteo) | Legitimately a runtime dependency — weather is inherently live |

### Scope caution

**Seeding ten crops properly beats seeding two thousand badly.** Start with the crops our users
actually grow — mango first — with complete growth stages, spacing, pests and Kc values. A library
thorough for ten crops is useful; a name and a Latin binomial for two thousand is decoration.

---

*Companion document: [CROP_MODULE_REVIEW.md](./CROP_MODULE_REVIEW.md) — mango lifecycle readiness.*
