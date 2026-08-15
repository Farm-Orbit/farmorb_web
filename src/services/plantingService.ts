import { createClient } from '@/lib/supabase/client';
import { Planting, CreatePlantingData, PlantingCycle } from '@/types/crop';

function throwIfError(error: { message: string } | null) {
    if (error) throw new Error(error.message);
}

export const PlantingService = {
    list: async (farmId: string): Promise<Planting[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('plantings')
            .select(`
                *,
                crop_types ( id, name, growing_type, supports_ratoon, max_ratoon_cycles ),
                crop_varieties ( id, name ),
                grow_locations ( id, name, size_hectares )
            `)
            .eq('farm_id', farmId)
            .order('planting_date', { ascending: false });
        throwIfError(error);
        return (data || []) as Planting[];
    },

    create: async (farmId: string, payload: CreatePlantingData): Promise<Planting> => {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('create_planting_with_cycle', {
            p_farm_id: farmId,
            p_location_id: payload.location_id,
            p_crop_type_id: payload.crop_type_id,
            p_planting_date: payload.planting_date,
            p_variety_id: payload.variety_id ?? null,
            p_planting_method: payload.planting_method ?? null,
            p_status: payload.status ?? 'planted',
            p_area_hectares: payload.area_hectares ?? null,
            p_plant_count: payload.plant_count ?? null,
            p_notes: payload.notes ?? null,
        });
        throwIfError(error);
        return data as Planting;
    },

    /**
     * Advances the planting to its next cycle — a new season for a perennial,
     * the next ratoon otherwise. The RPC decides which, enforces the ratoon
     * ceiling, and closes the previous cycle so only one is ever active.
     */
    startNextCycle: async (
        plantingId: string,
        startDate?: string
    ): Promise<PlantingCycle> => {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('start_next_cycle', {
            p_planting_id: plantingId,
            p_start_date: startDate ?? null,
        });
        throwIfError(error);
        return data as PlantingCycle;
    },

    listCycles: async (plantingId: string): Promise<PlantingCycle[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('planting_cycles')
            .select('*')
            .eq('planting_id', plantingId)
            .order('cycle_number');
        throwIfError(error);
        return (data || []) as PlantingCycle[];
    },

    getActiveCycle: async (plantingId: string): Promise<PlantingCycle | null> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('planting_cycles')
            .select('*')
            .eq('planting_id', plantingId)
            .eq('status', 'active')
            .order('cycle_number', { ascending: false })
            .limit(1)
            .maybeSingle();
        throwIfError(error);
        return data as PlantingCycle | null;
    },

    remove: async (id: string): Promise<void> => {
        const supabase = createClient();
        const { error } = await supabase.from('plantings').delete().eq('id', id);
        throwIfError(error);
    },
};
