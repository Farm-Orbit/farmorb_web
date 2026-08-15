export type ActivityType =
    | 'irrigation'
    | 'fertilisation'
    | 'spray'
    | 'pruning'
    | 'induction'
    | 'thinning'
    | 'bagging'
    | 'weeding'
    | 'land_prep'
    | 'other';

export type ObservationType = 'pest' | 'disease' | 'deficiency' | 'damage' | 'other';

export type Severity = 'trace' | 'low' | 'moderate' | 'high' | 'severe';

export interface Attachment {
    path: string;
    name: string;
    type: string;
}

export interface CropActivity {
    id: string;
    farm_id: string;
    planting_id?: string | null;
    location_id?: string | null;
    cycle_id?: string | null;
    activity_type: ActivityType;
    activity_date: string;
    inventory_item_id?: string | null;
    product_name?: string | null;
    active_ingredient?: string | null;
    rate?: number | null;
    rate_unit?: string | null;
    water_volume_l?: number | null;
    quantity?: number | null;
    quantity_unit?: string | null;
    phi_days?: number | null;
    rei_hours?: number | null;
    equipment?: string | null;
    weather_conditions?: Record<string, unknown> | null;
    labour_hours?: number | null;
    worker_count?: number | null;
    performed_by?: string | null;
    batch_id?: string | null;
    notes?: string | null;
    attachments?: Attachment[];
    created_at: string;
    updated_at: string;
    plantings?: { id: string; crop_types?: { name: string } | null } | null;
    grow_locations?: { id: string; name: string } | null;
}

export interface CreateActivityData {
    /** One submission may target several blocks; each becomes its own row. */
    targets: ActivityTarget[];
    activity_type: ActivityType;
    activity_date: string;
    inventory_item_id?: string | null;
    product_name?: string | null;
    active_ingredient?: string | null;
    rate?: number | null;
    rate_unit?: string | null;
    water_volume_l?: number | null;
    quantity?: number | null;
    quantity_unit?: string | null;
    phi_days?: number | null;
    rei_hours?: number | null;
    equipment?: string | null;
    labour_hours?: number | null;
    worker_count?: number | null;
    notes?: string | null;
}

/** A target is a planting when there is a crop in the ground, else bare land. */
export interface ActivityTarget {
    plantingId?: string | null;
    locationId?: string | null;
    cycleId?: string | null;
    /** Used to turn a per-hectare rate into a quantity. */
    areaHectares?: number | null;
    label: string;
}

export interface CropObservation {
    id: string;
    farm_id: string;
    planting_id?: string | null;
    location_id?: string | null;
    observed_on: string;
    observation_type: ObservationType;
    problem_name?: string | null;
    eppo_code?: string | null;
    severity: Severity;
    incidence_percent?: number | null;
    growth_stage?: string | null;
    observed_by?: string | null;
    notes?: string | null;
    attachments?: Attachment[];
    created_at: string;
    updated_at: string;
    plantings?: { id: string; crop_types?: { name: string } | null } | null;
    grow_locations?: { id: string; name: string } | null;
}

export interface CreateObservationData {
    planting_id?: string | null;
    location_id?: string | null;
    observed_on: string;
    observation_type: ObservationType;
    problem_name?: string | null;
    severity: Severity;
    incidence_percent?: number | null;
    growth_stage?: string | null;
    notes?: string | null;
    attachments?: Attachment[];
}

/** One row in the unified timeline — activities and observations together. */
export type TimelineEntry =
    | ({ kind: 'activity'; date: string } & CropActivity)
    | ({ kind: 'observation'; date: string } & CropObservation);
