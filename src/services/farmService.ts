import { createClient } from '@/lib/supabase/client';
import { Farm, CreateFarmData, UpdateFarmData } from '@/types/farm';
import { ListOptions, PaginatedList } from '@/types/list';

function throwIfError(error: { message: string } | null) {
    if (error) {
        throw new Error(error.message);
    }
}

export const FarmService = {
    getFarms: async (params?: ListOptions): Promise<PaginatedList<Farm>> => {
        const supabase = createClient();
        const page = params?.page ?? 1;
        const pageSize = params?.pageSize ?? 50;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('farms')
            .select('*', { count: 'exact' })
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (params?.filters?.search) {
            const search = Array.isArray(params.filters.search)
                ? params.filters.search[0]
                : params.filters.search;
            query = query.ilike('name', `%${search}%`);
        }

        const { data, error, count } = await query;
        throwIfError(error);

        const items = (data || []) as Farm[];
        return {
            items,
            page,
            pageSize,
            total: count ?? items.length,
        };
    },

    getFarmById: async (id: string): Promise<Farm> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('farms')
            .select('*')
            .eq('id', id)
            .single();
        throwIfError(error);
        return data as Farm;
    },

    createFarm: async (data: CreateFarmData): Promise<Farm> => {
        const supabase = createClient();
        const { data: farm, error } = await supabase.rpc('create_farm', {
            p_name: data.name,
            p_description: data.description ?? null,
            p_farm_type: data.farm_type ?? null,
            p_location_address: data.location_address ?? null,
            p_location_latitude: data.location_latitude ?? null,
            p_location_longitude: data.location_longitude ?? null,
            p_size_acres: data.size_acres ?? null,
            p_size_hectares: data.size_hectares ?? null,
        });
        throwIfError(error);
        return farm as Farm;
    },

    updateFarm: async (id: string, data: UpdateFarmData): Promise<Farm> => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { data: farm, error } = await supabase
            .from('farms')
            .update({
                name: data.name,
                description: data.description,
                farm_type: data.farm_type,
                location_address: data.location_address,
                location_latitude: data.location_latitude,
                location_longitude: data.location_longitude,
                size_acres: data.size_acres,
                size_hectares: data.size_hectares,
                updated_by: user?.id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select('*')
            .single();
        throwIfError(error);
        return farm as Farm;
    },

    deleteFarm: async (id: string): Promise<{ success: boolean }> => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
            .from('farms')
            .update({
                is_active: false,
                updated_by: user?.id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);
        throwIfError(error);
        return { success: true };
    },
};
