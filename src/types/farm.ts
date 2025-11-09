import { SortOrder } from '@/types/list';

export interface Farm {
    id: string;
    name: string;
    description?: string;
    farm_type?: string;
    location_address?: string;
    location_latitude?: number;
    location_longitude?: number;
    size_acres?: number;
    size_hectares?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;
}

export interface CreateFarmData {
    name: string;
    description?: string;
    farm_type?: string;
    location_address?: string;
    location_latitude?: number;
    location_longitude?: number;
    size_acres?: number;
    size_hectares?: number;
}

export interface UpdateFarmData extends Partial<CreateFarmData> {
    id: string;
}

export interface FarmState {
    farms: Farm[];
    page: number;
    pageSize: number;
    total: number;
    sortBy?: string;
    sortOrder?: SortOrder;
    filters?: Record<string, string | string[]>;
    currentFarm: Farm | null;
    isLoading: boolean;
    error: string | null;
}