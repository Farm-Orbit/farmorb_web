import { createClient } from '@/lib/supabase/client';
import { GrowLocation, CreateGrowLocationData } from '@/types/crop';
import { BoundaryPolygon, hectaresToAcres, polygonHectares } from '@/utils/geo';

function throwIfError(error: { message: string } | null) {
    if (error) throw new Error(error.message);
}

export const GrowLocationService = {
    list: async (farmId: string): Promise<GrowLocation[]> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('grow_locations')
            .select('*')
            .eq('farm_id', farmId)
            .order('name');
        throwIfError(error);
        return (data || []) as GrowLocation[];
    },

    create: async (farmId: string, payload: CreateGrowLocationData): Promise<GrowLocation> => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('grow_locations')
            .insert({
                farm_id: farmId,
                name: payload.name,
                location_type: payload.location_type,
                parent_location_id: payload.parent_location_id ?? null,
                size_hectares: payload.size_hectares ?? null,
                size_acres: payload.size_acres ?? null,
                gps_latitude: payload.gps_latitude ?? null,
                gps_longitude: payload.gps_longitude ?? null,
                soil_type: payload.soil_type ?? null,
                soil_ph: payload.soil_ph ?? null,
                irrigation_type: payload.irrigation_type ?? null,
                status: payload.status ?? 'active',
                notes: payload.notes ?? null,
                created_by: user?.id,
                updated_by: user?.id,
            })
            .select('*')
            .single();
        throwIfError(error);
        return data as GrowLocation;
    },

    update: async (
        id: string,
        payload: Partial<CreateGrowLocationData>
    ): Promise<GrowLocation> => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('grow_locations')
            .update({
                ...payload,
                updated_by: user?.id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select('*')
            .single();
        throwIfError(error);
        return data as GrowLocation;
    },

    /**
     * Saves a drawn boundary and the area it implies. The grower knows the
     * shape of a block far better than its hectares, so the drawing is the
     * source of truth and size follows from it.
     */
    saveBoundary: async (
        id: string,
        boundary: BoundaryPolygon | null
    ): Promise<GrowLocation> => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const hectares = polygonHectares(boundary);

        const { data, error } = await supabase
            .from('grow_locations')
            .update({
                boundary_coordinates: boundary,
                ...(hectares != null
                    ? {
                          size_hectares: hectares,
                          size_acres: Number(hectaresToAcres(hectares).toFixed(4)),
                      }
                    : {}),
                updated_by: user?.id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select('*')
            .single();
        throwIfError(error);
        return data as GrowLocation;
    },

    remove: async (id: string): Promise<void> => {
        const supabase = createClient();
        const { error } = await supabase.from('grow_locations').delete().eq('id', id);
        throwIfError(error);
    },
};
