import { createClient } from '@/lib/supabase/client';
import {
  Group,
  CreateGroupRequest,
  UpdateGroupRequest,
  AddAnimalToGroupRequest,
  BulkAddAnimalsRequest,
} from '@/types/group';
import { Animal } from '@/types/animal';
import { ListOptions, PaginatedList } from '@/types/list';
import { currentUserId, definedFields, fetchList, throwIfError } from './supabaseList';

const TEXT_FILTERS = ['name', 'purpose', 'location', 'description'];

export const GroupService = {
  // Group CRUD operations
  async getFarmGroups(farmId: string, params?: ListOptions): Promise<PaginatedList<Group>> {
    const supabase = createClient();
    const query = supabase
      .from('groups')
      .select('*', { count: 'exact' })
      .eq('farm_id', farmId);

    return fetchList<Group>(query, params, {
      textFilters: TEXT_FILTERS,
      defaultSort: { column: 'created_at', ascending: false },
    });
  },

  async getGroup(farmId: string, groupId: string): Promise<Group> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('farm_id', farmId)
      .eq('id', groupId)
      .single();
    throwIfError(error);
    return data as Group;
  },

  async createGroup(farmId: string, data: CreateGroupRequest): Promise<Group> {
    const supabase = createClient();
    const { color: _color, ...fields } = data as CreateGroupRequest & { color?: string };
    const { data: created, error } = await supabase
      .from('groups')
      .insert({ ...definedFields(fields as Record<string, unknown>), farm_id: farmId })
      .select('*')
      .single();
    throwIfError(error);
    return created as Group;
  },

  async updateGroup(farmId: string, groupId: string, data: UpdateGroupRequest): Promise<Group> {
    const supabase = createClient();
    const { color: _color, ...fields } = data as UpdateGroupRequest & { color?: string };
    const { data: updated, error } = await supabase
      .from('groups')
      .update(definedFields(fields as Record<string, unknown>))
      .eq('farm_id', farmId)
      .eq('id', groupId)
      .select('*')
      .single();
    throwIfError(error);
    return updated as Group;
  },

  async deleteGroup(farmId: string, groupId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('farm_id', farmId)
      .eq('id', groupId);
    throwIfError(error);
  },

  // Animal-Group relationship operations
  async addAnimalToGroup(
    groupId: string,
    animalId: string,
    data?: AddAnimalToGroupRequest
  ): Promise<void> {
    const supabase = createClient();
    const userId = await currentUserId(supabase);
    const { error } = await supabase.from('animal_groups').insert({
      group_id: groupId,
      animal_id: animalId,
      notes: data?.notes ?? null,
      added_by: userId,
    });
    throwIfError(error);
  },

  async removeAnimalFromGroup(groupId: string, animalId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('animal_groups')
      .delete()
      .eq('group_id', groupId)
      .eq('animal_id', animalId);
    throwIfError(error);
  },

  async getGroupAnimals(groupId: string, params?: ListOptions): Promise<PaginatedList<Animal>> {
    const supabase = createClient();
    // !inner turns the embed into a join filter, so this pages over animals
    // rather than over membership rows.
    const query = supabase
      .from('animals')
      .select('*, animal_groups!inner(group_id)', { count: 'exact' })
      .eq('animal_groups.group_id', groupId);

    return fetchList<Animal>(query, params, {
      textFilters: ['tag_id', 'name', 'breed'],
      defaultSort: { column: 'tag_id', ascending: true },
    });
  },

  async getAnimalGroups(animalId: string, params?: ListOptions): Promise<PaginatedList<Group>> {
    const supabase = createClient();
    const query = supabase
      .from('groups')
      .select('*, animal_groups!inner(animal_id)', { count: 'exact' })
      .eq('animal_groups.animal_id', animalId);

    return fetchList<Group>(query, params, {
      textFilters: TEXT_FILTERS,
      defaultSort: { column: 'name', ascending: true },
    });
  },

  async bulkAddAnimalsToGroup(groupId: string, data: BulkAddAnimalsRequest): Promise<void> {
    if (data.animal_ids.length === 0) {
      return;
    }

    const supabase = createClient();
    const userId = await currentUserId(supabase);
    const { error } = await supabase.from('animal_groups').upsert(
      data.animal_ids.map((animalId) => ({
        group_id: groupId,
        animal_id: animalId,
        notes: data.notes ?? null,
        added_by: userId,
      })),
      { onConflict: 'animal_id,group_id', ignoreDuplicates: true }
    );
    throwIfError(error);
  },
};

export default GroupService;
