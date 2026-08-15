import { createClient } from '@/lib/supabase/client';
import {
    Animal,
    AnimalMovement,
    CreateAnimalData,
    LogAnimalMovementRequest,
} from '@/types/animal';
import { ListOptions, PaginatedList } from '@/types/list';
import {
    currentUserId,
    definedFields,
    fetchList,
    throwIfError,
} from './supabaseList';

const TEXT_FILTERS = ['tag_id', 'name', 'breed', 'rfid'];

export const AnimalService = {
    // Get all animals for a farm
    getFarmAnimals: async (farmId: string, params?: ListOptions): Promise<PaginatedList<Animal>> => {
        try {
            const supabase = createClient();
            const query = supabase
                .from('animals')
                .select('*', { count: 'exact' })
                .eq('farm_id', farmId);

            return await fetchList<Animal>(query, params, {
                textFilters: TEXT_FILTERS,
                defaultSort: { column: 'created_at', ascending: false },
            });
        } catch (error: any) {
            // AnimalsTable reads .farmId off the error to render a farm-scoped
            // empty state, so keep decorating it the way the Axios path did.
            const apiError = new Error(error?.message ?? 'Failed to load animals');
            (apiError as any).error = error?.message ?? 'Failed to load animals';
            (apiError as any).farmId = farmId;
            throw apiError;
        }
    },

    // Get a single animal
    getAnimalById: async (farmId: string, animalId: string): Promise<Animal> => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('animals')
            .select('*')
            .eq('farm_id', farmId)
            .eq('id', animalId)
            .single();
        throwIfError(error);
        return data as Animal;
    },

    // Create a new animal
    createAnimal: async (farmId: string, data: CreateAnimalData): Promise<Animal> => {
        const supabase = createClient();
        const { data: created, error } = await supabase
            .from('animals')
            .insert({ ...definedFields(data as unknown as Record<string, unknown>), farm_id: farmId })
            .select('*')
            .single();
        throwIfError(error);
        return created as Animal;
    },

    // Update an existing animal
    updateAnimal: async (
        farmId: string,
        animalId: string,
        data: Partial<CreateAnimalData & { status?: string }>
    ): Promise<Animal> => {
        const supabase = createClient();
        const { data: updated, error } = await supabase
            .from('animals')
            .update(definedFields(data as Record<string, unknown>))
            .eq('farm_id', farmId)
            .eq('id', animalId)
            .select('*')
            .single();
        throwIfError(error);
        return updated as Animal;
    },

    // Delete an animal
    deleteAnimal: async (farmId: string, animalId: string): Promise<void> => {
        const supabase = createClient();
        const { error } = await supabase
            .from('animals')
            .delete()
            .eq('farm_id', farmId)
            .eq('id', animalId);
        throwIfError(error);
    },

    // Get animal movements
    getAnimalMovements: async (
        _farmId: string,
        animalId: string,
        limit?: number
    ): Promise<AnimalMovement[]> => {
        const supabase = createClient();
        let query = supabase
            .from('animal_movements')
            .select('*')
            .eq('animal_id', animalId)
            .order('moved_at', { ascending: false });

        if (limit && limit > 0) {
            query = query.limit(limit);
        }

        const { data, error } = await query;
        throwIfError(error);
        return (data ?? []) as AnimalMovement[];
    },

    // Log animal movement
    logAnimalMovement: async (
        _farmId: string,
        animalId: string,
        data: LogAnimalMovementRequest
    ): Promise<AnimalMovement> => {
        const supabase = createClient();
        const userId = await currentUserId(supabase);

        const { data: movement, error } = await supabase
            .from('animal_movements')
            .insert({
                animal_id: animalId,
                from_group_id: data.from_group_id ?? null,
                to_group_id: data.to_group_id ?? null,
                reason: data.reason,
                notes: data.notes ?? null,
                moved_at: data.moved_at ?? new Date().toISOString(),
                performed_by: userId,
            })
            .select('*')
            .single();
        throwIfError(error);
        return movement as AnimalMovement;
    },
};
