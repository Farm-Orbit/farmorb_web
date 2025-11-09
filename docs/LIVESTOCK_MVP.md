# Livestock MVP – User Stories & Schema

## Overview
This document captures the next FarmOrbit MVP scope for core livestock management inspired by the Farmbrite analysis. It focuses on bringing Farmbrite’s livestock, group, health, and breeding capabilities into FarmOrbit’s farm-centric architecture.

---

## Personas
- **Farm Owner**: Oversees operations, needs strategic insights.
- **Farm Manager**: Runs day-to-day workflows, maintains accurate records.
- **Farm Worker**: Performs field work, updates records from the ground.
- **Veterinarian / Consultant**: Provides health care, records treatments.

---

## User Stories

### 1. Group Management
- As a Farm Owner, I want to create and classify livestock groups (purpose, species, location) so animals stay organized.
- As a Farm Manager, I want to update group details (move locations, change status) so records reflect reality.
- As a Farm Worker, I want to view group summaries (headcount, alerts) so I know current priorities.
- As a Farm Owner, I want to archive or reactivate groups without losing history.
- As a Farm Manager, I want to record default care schedules per group for planning (stored as metadata only at this stage).

### 2. Animal Registry
- As a Farm Worker, I want to register animals with full identity details (tag numbers, RFID, breed, markings) so each animal is trackable.
- As a Farm Owner, I want to capture lifecycle data (birth, acquisition, status) to understand herd composition.
- As a Farm Manager, I want to link animals to parents and groups for lineage tracking and analytics.
- As a Farm Worker, I want to upload photos and documents for visual identification.
- As a Farm Manager, I want to record weights and other measurements over time to monitor growth and health trends.
- As a Farm Owner, I want accurate status changes (sold, deceased, transferred) so inventory stays correct.

### 3. Health Records
- As a Farm Manager, I want to schedule health procedures (vaccinations, treatments) so care is proactive.
- As a Farm Worker, I want to log completed treatments (medication, dosage, vet, cost) while in the field.
- As a Veterinarian, I want to attach lab results, diagnoses, and follow-up dates for continuity of care.
- As a Farm Owner, I want visibility into upcoming or overdue health events to manage risk.
- As a Farm Manager, I want recurring health plans per group (stored as templates/metadata for now) to streamline scheduling.

### 4. Breeding Management
- As a Farm Manager, I want to log heat/estrus observations so breeding timing is optimized.
- As a Farm Worker, I want to record breeding events (method, mate, handler) immediately after they occur.
- As a Farm Owner, I want to track pregnancies (confirmation, due date, status) for resource planning.
- As a Farm Worker, I want to capture birthing events (offspring details, complications) in real time.
- As a Farm Manager, I want lineage and breeding performance metrics to guide herd improvement.

### 5. Movement & Measurements
- As a Farm Worker, I want to record animal movements between groups/paddocks so pasture rotation is traceable.
- As a Farm Manager, I want complete movement histories for compliance and planning.
- As a Farm Worker, I want to log weights, body condition, and other measurements at regular intervals.

---

## Data Model & Schema (Draft)

### 1. `groups`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `farm_id` | UUID | Owning farm |
| `name` | text | Display name |
| `code` | text | Short identifier |
| `species` | enum (`cattle`, `sheep`, `goat`, `pig`, `poultry`, `camelid`, `equine`, `other`) |
| `purpose` | enum (`dairy`, `beef`, `breeding`, `meat`, `layers`, `grower`, `custom`) |
| `location` | text | Current paddock/pen |
| `status` | enum (`active`, `inactive`, `archived`) |
| `description` | text | Notes |
| `photo_url` | text | Representative image |
| `average_weight` | numeric | Aggregated metric |
| `headcount` | integer | Aggregated metric |
| `care_plan_metadata` | jsonb | Optional scheduling hints |
| `created_at`, `updated_at`, `created_by`, `updated_by` | audit |

Indexes: `(farm_id, name)`, `(farm_id, status)`, `(farm_id, purpose)`

---

### 2. `animals`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `farm_id` | UUID | Owning farm |
| `group_id` | UUID | Current group (nullable) |
| `tag_id` | text | Primary tag (unique per farm) |
| `secondary_tag_id` | text | Optional secondary tag |
| `rfid` | text | RFID/microchip |
| `name` | text | Animal name |
| `species` | enum | Reference to species |
| `breed` | text | Breed |
| `sex` | enum (`male`, `female`, `castrated`, `unknown`) |
| `color_markings` | text | Physical identifiers |
| `date_of_birth` | date | DOB |
| `birth_weight` | numeric | Optional |
| `birth_type` | enum (`single`, `twin`, `triplet`, `multiple`, `unknown`) |
| `status` | enum (`active`, `sold`, `deceased`, `transferred`, `archived`) |
| `status_date` | date | Status change date |
| `status_reason` | text | Reason/details |
| `sire_id`, `dam_id` | UUID | Parent references |
| `origin` | enum (`born`, `purchased`, `gifted`, `rescued`, `unknown`) |
| `acquisition_date` | date | When acquired |
| `purchase_price` | numeric | Cost |
| `purchase_source` | text | Vendor/seller |
| `sale_price` | numeric | If sold |
| `sale_date` | date | If sold |
| `sale_buyer` | text | Buyer info |
| `deceased_date` | date | If deceased |
| `deceased_reason` | text | Cause |
| `photo_url` | text | Primary photo |
| `notes` | text | Additional info |
| `created_at`, `updated_at`, `created_by`, `updated_by` | audit |

Indexes: `(farm_id, tag_id) unique`, `(farm_id, status)`, `(farm_id, group_id)`

---

### 3. `animal_photos`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `animal_id` | UUID | FK `animals.id` |
| `url` | text | Storage path |
| `caption` | text | Optional |
| `taken_at` | timestamptz | When photo taken |
| `uploaded_by` | UUID | User |
| `created_at` | timestamptz | Audit |

---

### 4. `animal_weights`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `animal_id` | UUID | FK |
| `weight` | numeric | Measurement |
| `unit` | enum (`kg`, `lb`) |
| `body_condition_score` | numeric | Optional |
| `measured_at` | date | Measurement date |
| `measured_by` | UUID | User |
| `location` | text | Optional |
| `notes` | text | Observations |
| `created_at` | timestamptz | Audit |

Indexes: `(animal_id, measured_at)` and `(animal_id, measured_at DESC)`

---

### 5. `animal_movements`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `animal_id` | UUID | FK |
| `from_group_id` | UUID | Previous group (nullable) |
| `to_group_id` | UUID | Destination group |
| `from_location` | text | Optional manual capture |
| `to_location` | text | Destination notes |
| `movement_type` | enum (`rotation`, `quarantine`, `sale`, `transfer`, `other`) |
| `moved_at` | date | Movement date |
| `reason` | text | Notes |
| `recorded_by` | UUID | User |
| `created_at` | timestamptz | Audit |

---

### 6. `health_records`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `animal_id` | UUID | FK |
| `farm_id` | UUID | For filtering |
| `record_type` | enum (`vaccination`, `treatment`, `checkup`, `injury`, `illness`, `lab_result`, `medication`, `other`) |
| `title` | text | Short summary |
| `description` | text | Detailed notes |
| `scheduled_at` | date | Planned date |
| `performed_at` | date | Actual date |
| `veterinarian_id` | UUID | Optional reference |
| `performed_by` | UUID | User |
| `medication` | text | Medication name |
| `dosage` | text | Dosage instructions |
| `unit_cost` | numeric | Cost item |
| `total_cost` | numeric | Aggregated cost |
| `follow_up_at` | date | Next check |
| `status` | enum (`scheduled`, `completed`, `missed`, `cancelled`) |
| `attachments` | jsonb | Documents/lab results |
| `created_at`, `updated_at`, `created_by`, `updated_by` | audit |

Indexes: `(animal_id, performed_at DESC)`, `(farm_id, record_type, performed_at DESC)`, `(status, scheduled_at)`

---

### 7. `breeding_records`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `farm_id` | UUID | FK |
| `female_animal_id` | UUID | Dam |
| `male_animal_id` | UUID | Sire |
| `event_type` | enum (`heat`, `breeding`, `pregnancy_check`, `pregnancy_confirmed`, `pregnancy_failed`, `birth`) |
| `method` | enum (`natural`, `AI`, `ET`, `unknown`) |
| `event_date` | date | Date/time |
| `status` | enum (`planned`, `in_progress`, `completed`, `failed`) |
| `location` | text | Optional |
| `notes` | text | Details |
| `technician` | text | Vet/technician |
| `technician_contact` | text | Contact info |
| `due_date` | date | For pregnancies |
| `offspring_count` | integer | For birth |
| `offspring_ids` | UUID[] | References to new animals (when registered) |
| `complications` | text | Observations |
| `follow_up_at` | date | e.g., pregnancy re-check |
| `created_at`, `updated_at`, `created_by`, `updated_by` | audit |

Indexes: `(female_animal_id, event_date)`, `(farm_id, event_type, event_date)`

---

### 8. Reference Tables
- `lookup_species`: species metadata (gestation, default measurements).
- `lookup_breeds`: breed lookup per species.
- `lookup_health_procedures`: recommended procedures and frequencies.
- `lookup_medications`: medication guidance, withdrawal periods.

---

## Relationships Summary
- Farms own groups, animals, health and breeding records.
- Groups aggregate animals; movement history provides a change log.
- Animals inherit lineage via `sire_id` and `dam_id` and relate to multiple health/breeding records.
- Measurements (weights) and movements are time-series data per animal.

---

## Next Steps
1. Validate schema with backend team (Go + Postgres migrations).
2. Align API contracts for CRUD and reporting endpoints.
3. Coordinate frontend data model updates (Redux slices, service clients).
4. Derive test scenarios (unit, integration, E2E) from user stories.
