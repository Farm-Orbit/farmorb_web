import { createClient } from '@/lib/supabase/client';
import {
  BreedingRecord,
  BreedingRecordList,
  BreedingTimelinePayload,
  CreateBreedingRecordRequest,
  UpdateBreedingRecordRequest,
} from '@/types/breeding';
import { ListOptions } from '@/types/list';
import { definedFields, fetchList, throwIfError } from './supabaseList';

const TEXT_FILTERS = ['notes'];

export const BreedingService = {
  getBreedingRecords: async (farmId: string, params?: ListOptions): Promise<BreedingRecordList> => {
    const supabase = createClient();
    const query = supabase
      .from('breeding_records')
      .select('*', { count: 'exact' })
      .eq('farm_id', farmId);

    return fetchList<BreedingRecord>(query, params, {
      textFilters: TEXT_FILTERS,
      defaultSort: { column: 'event_date', ascending: false },
    });
  },

  getBreedingRecordById: async (farmId: string, recordId: string): Promise<BreedingRecord> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('breeding_records')
      .select('*')
      .eq('farm_id', farmId)
      .eq('id', recordId)
      .single();
    throwIfError(error);
    return data as BreedingRecord;
  },

  createBreedingRecord: async (
    farmId: string,
    payload: CreateBreedingRecordRequest
  ): Promise<BreedingRecord> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('breeding_records')
      .insert({
        ...definedFields(payload as unknown as Record<string, unknown>),
        farm_id: farmId,
        offspring_ids: payload.offspring_ids ?? [],
        attachments: payload.attachments ?? [],
      })
      .select('*')
      .single();
    throwIfError(error);
    return data as BreedingRecord;
  },

  updateBreedingRecord: async (
    farmId: string,
    recordId: string,
    payload: UpdateBreedingRecordRequest
  ): Promise<BreedingRecord> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('breeding_records')
      .update(definedFields(payload as Record<string, unknown>))
      .eq('farm_id', farmId)
      .eq('id', recordId)
      .select('*')
      .single();
    throwIfError(error);
    return data as BreedingRecord;
  },

  deleteBreedingRecord: async (farmId: string, recordId: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase
      .from('breeding_records')
      .delete()
      .eq('farm_id', farmId)
      .eq('id', recordId);
    throwIfError(error);
  },

  getBreedingTimeline: async (
    farmId: string,
    animalId: string,
    limit?: number
  ): Promise<BreedingTimelinePayload> => {
    const supabase = createClient();
    // The timeline covers the animal as either the subject or the mate.
    let query = supabase
      .from('breeding_records')
      .select('*')
      .eq('farm_id', farmId)
      .or(`animal_id.eq.${animalId},mate_id.eq.${animalId}`)
      .order('event_date', { ascending: false });

    if (limit && limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    throwIfError(error);

    return {
      animal_id: animalId,
      items: (data ?? []) as BreedingRecord[],
    };
  },
};
