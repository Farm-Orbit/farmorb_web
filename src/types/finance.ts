import { CycleType } from '@/types/crop';

export type ExpenseCategory =
    | 'inputs'
    | 'labour'
    | 'machinery'
    | 'irrigation'
    | 'land'
    | 'services'
    | 'certification'
    | 'transport'
    | 'other';

export type SalesChannel = 'export' | 'wholesale' | 'farm_gate' | 'processing' | 'other';

export interface ExpenseCategoryRef {
    code: ExpenseCategory;
    label: string;
    sort_order: number;
}

export interface Expense {
    id: string;
    farm_id: string;
    expense_date: string;
    category: ExpenseCategory;
    description?: string | null;
    amount: number;
    location_id?: string | null;
    planting_id?: string | null;
    cycle_id?: string | null;
    supplier_id?: string | null;
    /** Set when the row came from a logged activity rather than being typed. */
    crop_activity_id?: string | null;
    is_derived: boolean;
    notes?: string | null;
    created_at: string;
    updated_at: string;
    crop_activities?: {
        id: string;
        activity_type: string;
        activity_date: string;
        product_name?: string | null;
    } | null;
    plantings?: { id: string; crop_types?: { name: string } | null } | null;
}

export interface CreateExpenseData {
    expense_date: string;
    category: ExpenseCategory;
    description?: string | null;
    amount: number;
    planting_id?: string | null;
    cycle_id?: string | null;
    location_id?: string | null;
    notes?: string | null;
}

export interface Sale {
    id: string;
    farm_id: string;
    harvest_id?: string | null;
    sale_date: string;
    channel: SalesChannel;
    customer_name?: string | null;
    quantity: number;
    quantity_unit: string;
    unit_price: number;
    /** Generated in the database from quantity × unit_price. */
    total_amount: number;
    notes?: string | null;
    created_at: string;
    updated_at: string;
    harvests?: {
        id: string;
        harvest_date: string;
        planting_id: string;
        plantings?: { crop_types?: { name: string } | null } | null;
    } | null;
}

export interface CreateSaleData {
    harvest_id: string;
    sale_date: string;
    channel: SalesChannel;
    customer_name?: string | null;
    quantity: number;
    quantity_unit: string;
    unit_price: number;
    notes?: string | null;
}

export interface PlantingFinancials {
    planting_id: string;
    farm_id: string;
    location_id?: string | null;
    crop_name?: string | null;
    total_cost: number;
    total_revenue: number;
    margin: number;
    harvested_kg: number;
    cost_per_kg?: number | null;
}

export interface CycleFinancials {
    cycle_id: string;
    planting_id: string;
    farm_id: string;
    cycle_number: number;
    cycle_type: CycleType;
    season_year?: number | null;
    total_cost: number;
    total_revenue: number;
    margin: number;
    harvested_kg: number;
}
