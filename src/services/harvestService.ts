import { createClient } from '@/lib/supabase/client';
import { Harvest, CreateHarvestData } from '@/types/crop';

function throwIfError(error: { message: string } | null) {
    if (error) throw new Error(error.message);
}

export const HarvestService = {
    list: async (farmId: string): Promise<Harvest[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('harvests')
            .select(`
                *,
                plantings (
                    id,
                    crop_types ( name )
                )
            `)
            .eq('farm_id', farmId)
            .order('harvest_date', { ascending: false });
        throwIfError(error);
        return (data || []) as Harvest[];
    },

    create: async (farmId: string, payload: CreateHarvestData): Promise<Harvest> => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('harvests')
            .insert({
                farm_id: farmId,
                planting_id: payload.planting_id,
                cycle_id: payload.cycle_id,
                harvest_date: payload.harvest_date,
                harvest_type: payload.harvest_type,
                quantity: payload.quantity,
                quantity_unit: payload.quantity_unit,
                quality_grade: payload.quality_grade ?? null,
                notes: payload.notes ?? null,
                harvested_by: user?.id,
                created_by: user?.id,
                updated_by: user?.id,
            })
            .select('*')
            .single();
        throwIfError(error);
        return data as Harvest;
    },

    remove: async (id: string): Promise<void> => {
        const supabase = createClient();
        const { error } = await supabase.from('harvests').delete().eq('id', id);
        throwIfError(error);
    },
};
