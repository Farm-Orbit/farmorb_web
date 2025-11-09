# FarmOrbit Livestock MVP Plan

_Date: 2025-11-09_

## 1. Purpose & Scope
- **Objective**: Deliver a best-in-class livestock management experience meeting or exceeding Farmbrite capabilities while leveraging FarmOrbit’s farm-centric architecture (farms → groups → animals).
- **Scope**: Groups, animals, health, and breeding workflows that directly support livestock operations. Includes schema updates, API surface, UI flows, user stories, and rollout plan.
- **Out of Scope (future phases)**: Task/work management, financial accounting, crop management, eCommerce, mapping, weather, advanced analytics beyond dashboards described herein.

## 2. Target Personas & Roles
| Persona | Description | Primary Goals | Access Level |
|---------|-------------|---------------|--------------|
| **Farm Owner** | Owns farm, oversees operations and compliance | Strategic planning, approvals, reporting | Full access |
| **Farm Manager** | Runs day-to-day livestock operations | Manage groups/animals, monitor health & breeding | Manage farm data |
| **Field Worker** | Performs animal care and chores | Log health/breeding events, update animal records from the field | Scoped access via mobile-friendly forms |
| **Veterinarian** | External/internal vet | Record treatments, review health history | Limited animal health access |

## 3. Product Pillars
1. **Complete Record Keeping**: Every animal & group has rich, auditable history.
2. **Actionable Schedules**: Health & breeding calendars drive reminders and compliance insights.
3. **Operational Visibility**: Dashboards & reports highlight current status, overdue events, and trends.
4. **Mobility & Offline Readiness** (design consideration): Interfaces optimized for field use, support queued updates when offline.

## 4. Epics & User Stories

### Epic A: Group Management
1. **Create livestock groups** — As a Farm Manager, I want to create groups with purpose, location, species, capacity, and notes so I can organize animals logically. _Acceptance_: Group created, audit log entry, visible in farm dashboard.
2. **Assign animals to groups** — As a Farm Manager, I want to bulk move animals into/out of groups while preserving history. _Acceptance_: Movement record created, animal current_group updated, capacity rules validated.
3. **Group summary view** — As Farm Owner/Manager, I want to view a group profile with counts, composition, and upcoming health/breeding events. _Acceptance_: UI shows stats, alerts, last movements.
4. **Group lifecycle** — As Farm Manager, I can archive/reactivate groups if empty. _Acceptance_: Archived groups hidden by default, history retained.

### Epic B: Animal Registry
1. **Register animals** — Capture core data (tag, species, breed, DOB, sex, origin, purchase cost). _Acceptance_: Unique IDs enforced, attachments optional, default status `active`.
2. **Enhanced profile** — Support photos, genetic lineage (sire/dam), physical traits, identifiers (RFID, ear tag). _Acceptance_: UI component with versioned history.
3. **Movement tracking** — Log inter-group moves with reason, dates, operator. _Acceptance_: Movement timeline accessible, triggers capacity check.
4. **Status & disposition** — Update animal status (active, sold, deceased, transferred) with mandatory context. _Acceptance_: On status change, compliance reminders updated accordingly.

### Epic C: Health Management
1. **Health schedules** — Define recurring schedules per species/group (vaccinations, treatments). _Acceptance_: Generates future reminders and calendar entries.
2. **Record treatments** — Enter health events with vet, medication, dosage, cost, outcome, documents. _Acceptance_: Health record stored, inventory hooks in future phase.
3. **Health dashboards** — Provide per-farm and per-group health KPIs (overdue treatments, incidents, average score). _Acceptance_: Filters by species, time range.
4. **Alerts & reminders** — Overdue health events trigger high-priority notifications. _Acceptance_: Reminder logs stored, dismissal tracking available.

### Epic D: Breeding Management
1. **Cycle tracking** — Log heat/estrus observations with expected windows. _Acceptance_: Predictive schedule shown, reminder generated.
2. **Breeding events** — Record natural/AI breeding with mate, method, notes. _Acceptance_: Event triggers pregnancy watch with expected milestones.
3. **Pregnancy tracking** — Manage pregnancy status, check-ins, outcomes (successful, failed). _Acceptance_: Calendar view; expected due dates with reminder hooks.
4. **Offspring registration** — Automatically create new animal records linked to parents when birth logged. _Acceptance_: Quick-add workflow with litter handling.

### Epic E: Reporting & Insights (MVP Scope)
1. Group overview dashboard.
2. Health compliance report (completed vs overdue treatments).
3. Breeding performance overview (success rates, calving intervals).

## 5. Domain Data Model

### 5.1 Entity Relationships
```
Farm 1─* Group 1─* Animal 1─* HealthRecord
                         │
                         └─* BreedingRecord
Animal 1─* Movement
```

### 5.2 Tables & Fields (New or Updated)

#### `groups` (existing, extend)
| Field | Type | Notes |
|-------|------|-------|
| `id` (PK) | UUID | existing |
| `farm_id` (FK) | UUID | existing |
| `name` | text | existing |
| `species` | text | `cattle`, `sheep`, `goat`, `swine`, `poultry`, `mixed`, etc. |
| `purpose` | text | breeding, dairy, meat, quarantine, etc. |
| `location` | text | physical location/pen |
| `capacity` | int | optional max headcount |
| `status` | text | active, archived |
| `notes` | text | free-form |
| `created_at/updated_at` | timestamptz | existing |

#### `animals`
| Field | Type | Notes |
|-------|------|-------|
| `id` (PK) | UUID |
| `farm_id` (FK) | UUID |
| `group_id` (FK) | UUID | current group |
| `external_id` | text | farmer-provided unique tag |
| `rfid` | text | optional |
| `name` | text | optional |
| `species` | text | enumerated |
| `breed` | text | optional |
| `sex` | text | male/female/other |
| `birth_date` | date |
| `birth_weight` | numeric | optional |
| `current_weight` | numeric | optional, last recorded |
| `color_markings` | text |
| `status` | text | active/sold/deceased/transferred |
| `status_reason` | text | required if not active |
| `origin_type` | text | born_on_farm, purchased, transferred |
| `origin_details` | jsonb | seller info, purchase price |
| `sire_id`/`dam_id` | UUID | nullable FK to animals |
| `genetic_notes` | text |
| `photos` | jsonb | array of media references |
| `created_at/updated_at` | timestamptz |

#### `animal_movements`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID |
| `animal_id` | UUID |
| `from_group_id` | UUID | nullable |
| `to_group_id` | UUID |
| `moved_at` | timestamptz |
| `reason` | text |
| `performed_by` | UUID | user |
| `notes` | text |

#### `health_records`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID |
| `farm_id` | UUID |
| `animal_id` | UUID |
| `group_id` | UUID | optional (group-wide treatment) |
| `record_type` | text | vaccination, treatment, exam, injury |
| `title` | text |
| `description` | text |
| `performed_at` | timestamptz |
| `performed_by` | uuid | user or vet contact |
| `vet_name` | text |
| `medication` | text |
| `dosage` | text |
| `withdrawal_period` | interval | optional |
| `cost` | numeric |
| `attachments` | jsonb |
| `follow_up_date` | date | optional |
| `outcome` | text |
| `health_score` | int | optional 1-10 |
| `created_at/updated_at` | timestamptz |

#### `health_schedules`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID |
| `farm_id` | UUID |
| `target_type` | text | `species`, `group`, `animal` |
| `target_id` | UUID | nullable depending on type |
| `name` | text |
| `description` | text |
| `frequency_type` | text | once, recurring |
| `frequency_interval` | interval | e.g., 6 months |
| `start_date` | date |
| `lead_time_days` | int | reminder lead time |
| `active` | boolean |

#### `breeding_records`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID |
| `farm_id` | UUID |
| `animal_id` | UUID |
| `record_type` | text | heat, breeding, pregnancy_check, birth |
| `event_date` | date |
| `mate_id` | UUID | optional |
| `method` | text | natural, AI, embryo |
| `status` | text | planned, completed, failed |
| `gestation_days` | int | auto-calc |
| `expected_due_date` | date |
| `actual_due_date` | date |
| `offspring_count` | int |
| `offspring_ids` | jsonb |
| `notes` | text |
| `attachments` | jsonb |
| `created_at/updated_at` | timestamptz |

#### `notifications` (extend existing or add linking fields)
- Capture event → user delivery, supporting health/breeding alerts and reminders.

## 6. API Design Overview

### Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/farms/{farm_id}/groups` | List groups with filters (species, status) |
| POST | `/api/farms/{farm_id}/groups` | Create group |
| GET | `/api/farms/{farm_id}/groups/{group_id}` | Group profile summary |
| PUT | `/api/farms/{farm_id}/groups/{group_id}` | Update details |
| DELETE | `/api/farms/{farm_id}/groups/{group_id}` | Archive (soft delete) |
| POST | `/api/farms/{farm_id}/groups/{group_id}/bulk-assign` | Move animals |

### Animals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/farms/{farm_id}/animals` | Supports filtering by group, status, species |
| POST | `/api/farms/{farm_id}/animals` | Register animal(s) |
| GET | `/api/farms/{farm_id}/animals/{animal_id}` | Detailed profile |
| PUT | same | Update profile |
| PATCH | same | Status updates |
| POST | `/api/farms/{farm_id}/animals/{animal_id}/movements` | Record movement |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/farms/{farm_id}/health-records` | List with filters |
| POST | `/api/farms/{farm_id}/health-records` | Create record |
| GET | `/api/farms/{farm_id}/health-records/{id}` | Detail |
| PUT | same | Update |
| GET | `/api/farms/{farm_id}/health-schedules` | Manage schedules |
| POST | `/api/farms/{farm_id}/health-schedules` | Create schedule |
| PATCH | `/api/farms/{farm_id}/health-schedules/{id}/status` | Activate/deactivate |

### Breeding
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/farms/{farm_id}/breeding-records` |
| POST | `/api/farms/{farm_id}/breeding-records` |
| GET | `/api/farms/{farm_id}/breeding-records/{id}` |
| PUT | same |
| GET | `/api/farms/{farm_id}/animals/{animal_id}/breeding-timeline` | Animal-specific view |

### Dashboards & Reports (read-only endpoints)
- `/api/farms/{farm_id}/dashboards/livestock-overview`
- `/api/farms/{farm_id}/reports/health-compliance`
- `/api/farms/{farm_id}/reports/breeding-performance`

## 7. UI & Workflow Architecture
1. **Farm Dashboard Enhancements**: Add livestock summary cards (total animals, groups, overdue health events, breeding statuses).
2. **Group Detail Page**: Tabs for overview, animals, health schedules, breeding snapshot.
3. **Animal Detail Page**: Timeline (movements, health, breeding), quick log actions.
4. **Health Scheduler**: Calendar/list view with filters, create schedule wizard, reminder configuration.
5. **Breeding Planner**: Calendar with cycle predictions, timeline view, quick log forms.
6. **Report Dashboards**: Charts (bar for compliance, line for success rate) and summary tables.

## 8. Notifications & Automation
- Email & in-app notifications for upcoming health events, overdue logs, breeding milestones.
- Optional SMS hooks (future).
- Auto-updating reminder state when associated event logged (e.g., recording vaccination marks reminder resolved).
- Webhook-ready architecture for future integrations.

## 9. Security & Permissions
- Extend role system: add `Manager`, `Worker`, `Vet` roles with scoped permissions.
- Fine-grained policy examples:
  - Workers: read animals/groups, create health & breeding records if permitted.
  - Vets: limited to health records, no deletion rights.
  - Managers: full CRUD within farm.
- Audit logging for all changes to critical tables (`animals`, `health_records`, `breeding_records`).

## 10. Rollout & Phasing

| Phase | Timeline | Deliverables |
|-------|----------|--------------|
| **Phase 1** | Weeks 1-4 | Schema migrations, backend CRUD for groups & animals, movement tracking, updated UI for groups/animals |
| **Phase 2** | Weeks 5-8 | Health schedules & records (backend + UI), dashboards MVP |
| **Phase 3** | Weeks 9-12 | Breeding records & timelines, offspring quick-add |
| **Phase 4** | Weeks 13-16 | Buffer for polish, feeding management groundwork, usability iterations |
| **Phase 5** | Weeks 17-20 | Movement/location enhancements, optimization |
| **Phase 6** | Weeks 21-24 | Financial tracking (basic) |
| **Phase 7** | Weeks 25-32 | Advanced analytics/reporting |

_Actual execution can adapt but ensures dependencies resolved in order._

## 11. Acceptance Criteria Summary
- 100% of animals have accessible profile with health/breeding history.
- Health schedules drive reminders and compliance indicators.
- Breeding planner generates expected due dates and supports offspring registration.
- Movement logging ensures animal history integrity.
- Reports provide actionable metrics for compliance and breeding performance.
- Role-based permissions enforced for new modules.

## 12. Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Complex scheduling logic | High | Build reusable scheduler service with thorough unit tests |
| Data migration for existing animals | Medium | Provide migration script with default values, manual review UI |
| Reminder fatigue for large farms | Medium | Allow configurable reminder cadence and batching |
| Mobile usability | High | Design responsive layouts, consider offline local storage early |

## 13. References
- `FARMBRITE_ANALYSIS.md` — competitive breakdown and feature inspiration.
- `PRODUCT_ROADMAP.md` — updated roadmap aligning with this plan.
- Existing schema definitions in `farmorb_api/internal` for alignment.
