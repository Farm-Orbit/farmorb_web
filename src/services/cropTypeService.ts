import { createClient } from '@/lib/supabase/client';
import {
    CropType,
    CreateCropTypeData,
    CropVariety,
    CreateCropVarietyData,
} from '@/types/crop';

function throwIfError(error: { message: string } | null) {
    if (error) throw new Error(error.message);
}

export const CropTypeService = {
    list: async (farmId: string): Promise<CropType[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('crop_types')
            .select('*')
            .eq('farm_id', farmId)
            .order('name');
        throwIfError(error);
        return (data || []) as CropType[];
    },

    create: async (farmId: string, payload: CreateCropTypeData): Promise<CropType> => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('crop_types')
            .insert({
                farm_id: farmId,
                name: payload.name,
                growing_type: payload.growing_type,
                scientific_name: payload.scientific_name ?? null,
                category: payload.category ?? null,
                months_to_first_harvest: payload.months_to_first_harvest ?? null,
                default_spacing_row_meters: payload.default_spacing_row_meters ?? null,
                default_spacing_plant_meters: payload.default_spacing_plant_meters ?? null,
                plants_per_hectare: payload.plants_per_hectare ?? null,
                expected_yield_per_hectare: payload.expected_yield_per_hectare ?? null,
                supports_ratoon: payload.supports_ratoon ?? false,
                max_ratoon_cycles: payload.max_ratoon_cycles ?? null,
                created_by: user?.id,
                updated_by: user?.id,
            })
            .select('*')
            .single();
        throwIfError(error);
        return data as CropType;
    },

    update: async (id: string, payload: Partial<CreateCropTypeData>): Promise<CropType> => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('crop_types')
            .update({
                ...payload,
                updated_by: user?.id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select('*')
            .single();
        throwIfError(error);
        return data as CropType;
    },

    remove: async (id: string): Promise<void> => {
        const supabase = createClient();
        const { error } = await supabase.from('crop_types').delete().eq('id', id);
        throwIfError(error);
    },

    listVarieties: async (cropTypeId: string): Promise<CropVariety[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('crop_varieties')
            .select('*')
            .eq('crop_type_id', cropTypeId)
            .order('name');
        throwIfError(error);
        return (data || []) as CropVariety[];
    },

    createVariety: async (
        cropTypeId: string,
        payload: CreateCropVarietyData
    ): Promise<CropVariety> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('crop_varieties')
            .insert({
                crop_type_id: cropTypeId,
                name: payload.name,
                months_to_maturity: payload.months_to_maturity ?? null,
                expected_yield: payload.expected_yield ?? null,
            })
            .select('*')
            .single();
        throwIfError(error);
        return data as CropVariety;
    },

    removeVariety: async (id: string): Promise<void> => {
        const supabase = createClient();
        const { error } = await supabase.from('crop_varieties').delete().eq('id', id);
        throwIfError(error);
    },
};
