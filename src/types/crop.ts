export type CropCategory =
    | 'fruit'
    | 'vegetable'
    | 'grain'
    | 'legume'
    | 'root'
    | 'tuber'
    | 'herb'
    | 'spice'
    | 'other';

export type GrowingType = 'annual' | 'perennial' | 'ratoon' | 'biennial';

export type LocationType =
    | 'block'
    | 'field'
    | 'bed'
    | 'greenhouse'
    | 'nursery'
    | 'plot'
    | 'section'
    | 'other';

export type LocationStatus = 'active' | 'fallow' | 'retired' | 'preparing';

export type PlantingStatus =
    | 'planned'
    | 'planted'
    | 'establishing'
    | 'vegetative'
    | 'flowering'
    | 'fruiting'
    | 'harvesting'
    | 'harvested'
    | 'terminated';

/**
 * Describes a single pick. Which season or ratoon it belongs to comes from the
 * cycle it references, not from here.
 */
export type HarvestType = 'partial' | 'final';

export type CycleType = 'mother' | 'ratoon' | 'season';

export type PlantingMethod =
    | 'direct_seed'
    | 'transplant'
    | 'graft'
    | 'crown'
    | 'slip'
    | 'sucker'
    | 'cutting'
    | 'bulb'
    | 'tuber'
    | 'other';

export interface CropType {
    id: string;
    farm_id: string;
    name: string;
    scientific_name?: string | null;
    category?: CropCategory | null;
    growing_type: GrowingType;
    months_to_first_harvest?: number | null;
    supports_ratoon?: boolean | null;
    max_ratoon_cycles?: number | null;
    created_at: string;
    updated_at: string;
}

export interface CreateCropTypeData {
    name: string;
    growing_type: GrowingType;
    scientific_name?: string;
    category?: CropCategory;
    months_to_first_harvest?: number;
    supports_ratoon?: boolean;
    max_ratoon_cycles?: number;
}

export interface CropVariety {
    id: string;
    crop_type_id: string;
    name: string;
    months_to_maturity?: number | null;
    expected_yield?: number | null;
    created_at: string;
    updated_at: string;
}

export interface CreateCropVarietyData {
    name: string;
    months_to_maturity?: number;
    expected_yield?: number;
}

export interface GrowLocation {
    id: string;
    farm_id: string;
    parent_location_id?: string | null;
    name: string;
    location_type: LocationType;
    size_hectares?: number | null;
    size_acres?: number | null;
    soil_type?: string | null;
    status: LocationStatus;
    notes?: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateGrowLocationData {
    name: string;
    location_type: LocationType;
    parent_location_id?: string;
    size_hectares?: number;
    size_acres?: number;
    soil_type?: string;
    status?: LocationStatus;
    notes?: string;
}

export interface Planting {
    id: string;
    farm_id: string;
    location_id: string;
    crop_type_id: string;
    variety_id?: string | null;
    planting_date: string;
    planting_method?: string | null;
    status: PlantingStatus;
    area_hectares?: number | null;
    plant_count?: number | null;
    notes?: string | null;
    created_at: string;
    updated_at: string;
    crop_types?: Pick<
        CropType,
        'id' | 'name' | 'growing_type' | 'supports_ratoon' | 'max_ratoon_cycles'
    > | null;
    crop_varieties?: Pick<CropVariety, 'id' | 'name'> | null;
    grow_locations?: Pick<GrowLocation, 'id' | 'name'> | null;
}

export interface CreatePlantingData {
    location_id: string;
    crop_type_id: string;
    planting_date: string;
    variety_id?: string;
    planting_method?: string;
    status?: PlantingStatus;
    area_hectares?: number;
    plant_count?: number;
    notes?: string;
}

export interface PlantingCycle {
    id: string;
    planting_id: string;
    cycle_number: number;
    cycle_type: CycleType;
    /** Set for perennial seasons; null for mother and ratoon cycles. */
    season_year?: number | null;
    start_date: string;
    status: 'active' | 'harvested' | 'terminated';
    expected_yield?: number | null;
    actual_yield?: number | null;
    notes?: string | null;
    created_at: string;
    updated_at: string;
}

export interface Harvest {
    id: string;
    farm_id: string;
    planting_id: string;
    cycle_id: string;
    harvest_date: string;
    harvest_type: HarvestType;
    quantity: number;
    quantity_unit: string;
    quality_grade?: string | null;
    notes?: string | null;
    created_at: string;
    updated_at: string;
    plantings?: Pick<Planting, 'id'> & { crop_types?: Pick<CropType, 'name'> | null } | null;
    planting_cycles?: Pick<
        PlantingCycle,
        'id' | 'cycle_number' | 'cycle_type' | 'season_year'
    > | null;
}

export interface CreateHarvestData {
    planting_id: string;
    cycle_id: string;
    harvest_date: string;
    harvest_type: HarvestType;
    quantity: number;
    quantity_unit: string;
    quality_grade?: string;
    notes?: string;
}

export interface CropState {
    cropTypes: CropType[];
    varieties: CropVariety[];
    locations: GrowLocation[];
    plantings: Planting[];
    cycles: PlantingCycle[];
    harvests: Harvest[];
    isLoading: boolean;
    error: string | null;
}
