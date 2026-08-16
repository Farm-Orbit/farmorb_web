import { createClient } from '@/lib/supabase/client';
import {
    CreateExpenseData,
    CreateSaleData,
    CycleFinancials,
    Expense,
    ExpenseCategoryRef,
    PlantingFinancials,
    Sale,
} from '@/types/finance';

function throwIfError(error: { message: string } | null) {
    if (error) throw new Error(error.message);
}

export const ExpenseService = {
    categories: async (): Promise<ExpenseCategoryRef[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('expense_categories')
            .select('*')
            .order('sort_order');
        throwIfError(error);
        return (data ?? []) as ExpenseCategoryRef[];
    },

    list: async (farmId: string): Promise<Expense[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('expenses')
            .select(`
                *,
                crop_activities ( id, activity_type, activity_date, product_name ),
                plantings ( id, crop_types ( name ) )
            `)
            .eq('farm_id', farmId)
            .order('expense_date', { ascending: false });
        throwIfError(error);
        return (data ?? []) as unknown as Expense[];
    },

    /** Manual entry only — derived rows are written by the activity trigger. */
    create: async (farmId: string, payload: CreateExpenseData): Promise<Expense> => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('expenses')
            .insert({
                farm_id: farmId,
                expense_date: payload.expense_date,
                category: payload.category,
                description: payload.description ?? null,
                amount: payload.amount,
                planting_id: payload.planting_id ?? null,
                cycle_id: payload.cycle_id ?? null,
                location_id: payload.location_id ?? null,
                notes: payload.notes ?? null,
                is_derived: false,
                created_by: user?.id ?? null,
            })
            .select('*')
            .single();
        throwIfError(error);
        return data as Expense;
    },

    remove: async (id: string): Promise<void> => {
        const supabase = createClient();
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        throwIfError(error);
    },
};

export const SaleService = {
    list: async (farmId: string): Promise<Sale[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('sales')
            .select(`
                *,
                harvests ( id, harvest_date, planting_id, plantings ( crop_types ( name ) ) )
            `)
            .eq('farm_id', farmId)
            .order('sale_date', { ascending: false });
        throwIfError(error);
        return (data ?? []) as unknown as Sale[];
    },

    create: async (farmId: string, payload: CreateSaleData): Promise<Sale> => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('sales')
            .insert({
                farm_id: farmId,
                harvest_id: payload.harvest_id,
                sale_date: payload.sale_date,
                channel: payload.channel,
                customer_name: payload.customer_name ?? null,
                quantity: payload.quantity,
                quantity_unit: payload.quantity_unit,
                unit_price: payload.unit_price,
                notes: payload.notes ?? null,
                created_by: user?.id ?? null,
            })
            .select('*')
            .single();
        throwIfError(error);
        return data as Sale;
    },
};

export const FinancialsService = {
    byPlanting: async (farmId: string): Promise<PlantingFinancials[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('planting_financials')
            .select('*')
            .eq('farm_id', farmId);
        throwIfError(error);
        return (data ?? []) as PlantingFinancials[];
    },

    byCycle: async (farmId: string): Promise<CycleFinancials[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('cycle_financials')
            .select('*')
            .eq('farm_id', farmId)
            .order('cycle_number');
        throwIfError(error);
        return (data ?? []) as CycleFinancials[];
    },
};
