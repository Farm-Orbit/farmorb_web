import { createClient } from '@/lib/supabase/client';
import {
    Attachment,
    CreateActivityData,
    CreateObservationData,
    CropActivity,
    CropObservation,
} from '@/types/activity';

function throwIfError(error: { message: string } | null) {
    if (error) throw new Error(error.message);
}

const ACTIVITY_SELECT = `
    *,
    plantings ( id, crop_types ( name ) ),
    grow_locations ( id, name )
`;

export const ActivityService = {
    list: async (farmId: string, plantingId?: string): Promise<CropActivity[]> => {
        const supabase = createClient();
        let query = supabase
            .from('crop_activities')
            .select(ACTIVITY_SELECT)
            .eq('farm_id', farmId)
            .order('activity_date', { ascending: false })
            .order('created_at', { ascending: false });

        if (plantingId) {
            query = query.eq('planting_id', plantingId);
        }

        const { data, error } = await query;
        throwIfError(error);
        return (data ?? []) as unknown as CropActivity[];
    },

    /**
     * One submission, one call — every target becomes a row sharing a batch_id
     * so the timeline can present it as the single action it was. Stock is
     * decremented by a database trigger, not here.
     */
    create: async (farmId: string, payload: CreateActivityData): Promise<CropActivity[]> => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const batchId = payload.targets.length > 1 ? crypto.randomUUID() : null;

        // A per-hectare rate is split across targets by their area, so the
        // quantity recorded against each block is the amount it actually got.
        const totalArea = payload.targets.reduce(
            (sum, t) => sum + (t.areaHectares ?? 0),
            0
        );

        const rows = payload.targets.map((target) => {
            const share =
                payload.quantity != null && totalArea > 0 && target.areaHectares
                    ? (payload.quantity * target.areaHectares) / totalArea
                    : payload.quantity ?? null;

            return {
                farm_id: farmId,
                planting_id: target.plantingId ?? null,
                location_id: target.locationId ?? null,
                cycle_id: target.cycleId ?? null,
                activity_type: payload.activity_type,
                activity_date: payload.activity_date,
                inventory_item_id: payload.inventory_item_id ?? null,
                product_name: payload.product_name ?? null,
                active_ingredient: payload.active_ingredient ?? null,
                rate: payload.rate ?? null,
                rate_unit: payload.rate_unit ?? null,
                water_volume_l: payload.water_volume_l ?? null,
                quantity: share != null ? Number(share.toFixed(3)) : null,
                quantity_unit: payload.quantity_unit ?? null,
                phi_days: payload.phi_days ?? null,
                rei_hours: payload.rei_hours ?? null,
                equipment: payload.equipment ?? null,
                labour_hours: payload.labour_hours ?? null,
                worker_count: payload.worker_count ?? null,
                performed_by: user?.id ?? null,
                batch_id: batchId,
                notes: payload.notes ?? null,
            };
        });

        const { data, error } = await supabase
            .from('crop_activities')
            .insert(rows)
            .select(ACTIVITY_SELECT);
        throwIfError(error);
        return (data ?? []) as unknown as CropActivity[];
    },

    remove: async (id: string): Promise<void> => {
        const supabase = createClient();
        const { error } = await supabase.from('crop_activities').delete().eq('id', id);
        throwIfError(error);
    },

    /**
     * The date a planting may next be harvested, given open pre-harvest
     * intervals. Null when nothing restricts it.
     */
    earliestSafeHarvestDate: async (plantingId: string): Promise<string | null> => {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('earliest_safe_harvest_date', {
            p_planting_id: plantingId,
        });
        throwIfError(error);
        return (data as string | null) ?? null;
    },
};

export const ObservationService = {
    list: async (farmId: string, plantingId?: string): Promise<CropObservation[]> => {
        const supabase = createClient();
        let query = supabase
            .from('crop_observations')
            .select(`*, plantings ( id, crop_types ( name ) ), grow_locations ( id, name )`)
            .eq('farm_id', farmId)
            .order('observed_on', { ascending: false });

        if (plantingId) {
            query = query.eq('planting_id', plantingId);
        }

        const { data, error } = await query;
        throwIfError(error);
        return (data ?? []) as unknown as CropObservation[];
    },

    create: async (
        farmId: string,
        payload: CreateObservationData
    ): Promise<CropObservation> => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('crop_observations')
            .insert({
                farm_id: farmId,
                planting_id: payload.planting_id ?? null,
                location_id: payload.location_id ?? null,
                observed_on: payload.observed_on,
                observation_type: payload.observation_type,
                problem_name: payload.problem_name ?? null,
                severity: payload.severity,
                incidence_percent: payload.incidence_percent ?? null,
                growth_stage: payload.growth_stage ?? null,
                notes: payload.notes ?? null,
                attachments: payload.attachments ?? [],
                observed_by: user?.id ?? null,
            })
            .select('*')
            .single();
        throwIfError(error);
        return data as CropObservation;
    },
};

/**
 * Farm files live under <farm_id>/<entity>/<file>; the storage policies read
 * membership from that first path segment, so the prefix is not cosmetic.
 */
export const FarmFileService = {
    upload: async (farmId: string, entity: string, file: File): Promise<Attachment> => {
        const supabase = createClient();
        const safeName = file.name.replace(/[^\w.\-]/g, '_');
        const path = `${farmId}/${entity}/${crypto.randomUUID()}-${safeName}`;

        const { error } = await supabase.storage
            .from('farm-files')
            .upload(path, file, { contentType: file.type, upsert: false });
        throwIfError(error);

        return { path, name: file.name, type: file.type };
    },

    /** Signed because the bucket is private; expires in an hour. */
    signedUrl: async (path: string): Promise<string | null> => {
        const supabase = createClient();
        const { data, error } = await supabase.storage
            .from('farm-files')
            .createSignedUrl(path, 3600);
        throwIfError(error);
        return data?.signedUrl ?? null;
    },
};
