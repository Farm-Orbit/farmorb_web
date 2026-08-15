import { createClient } from '@/lib/supabase/client';
import {
  CreateFeedingRecordRequest,
  FeedingRecord,
  FeedingRecordList,
  UpdateFeedingRecordRequest,
} from '@/types/feeding';
import { ListOptions } from '@/types/list';
import { currentUserId, definedFields, fetchList, throwIfError } from './supabaseList';

const TEXT_FILTERS = ['feed_type', 'notes'];

export const FeedingService = {
  getFeedingRecords: async (farmId: string, params?: ListOptions): Promise<FeedingRecordList> => {
    const supabase = createClient();
    const query = supabase
      .from('feeding_records')
      .select('*', { count: 'exact' })
      .eq('farm_id', farmId);

    return fetchList<FeedingRecord>(query, params, {
      textFilters: TEXT_FILTERS,
      defaultSort: { column: 'date', ascending: false },
    });
  },

  getFeedingRecordById: async (farmId: string, recordId: string): Promise<FeedingRecord> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('feeding_records')
      .select('*')
      .eq('farm_id', farmId)
      .eq('id', recordId)
      .single();
    throwIfError(error);
    return data as FeedingRecord;
  },

  createFeedingRecord: async (
    farmId: string,
    payload: CreateFeedingRecordRequest
  ): Promise<FeedingRecord> => {
    const supabase = createClient();
    const userId = await currentUserId(supabase);
    const { data, error } = await supabase
      .from('feeding_records')
      .insert({
        ...definedFields(payload as unknown as Record<string, unknown>),
        farm_id: farmId,
        performed_by: userId,
      })
      .select('*')
      .single();
    throwIfError(error);
    return data as FeedingRecord;
  },

  updateFeedingRecord: async (
    farmId: string,
    recordId: string,
    payload: UpdateFeedingRecordRequest
  ): Promise<FeedingRecord> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('feeding_records')
      .update(definedFields(payload as Record<string, unknown>))
      .eq('farm_id', farmId)
      .eq('id', recordId)
      .select('*')
      .single();
    throwIfError(error);
    return data as FeedingRecord;
  },

  deleteFeedingRecord: async (farmId: string, recordId: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase
      .from('feeding_records')
      .delete()
      .eq('farm_id', farmId)
      .eq('id', recordId);
    throwIfError(error);
  },
};
