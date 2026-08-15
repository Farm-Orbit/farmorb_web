import { createClient } from '@/lib/supabase/client';
import {
  CreateHealthRecordRequest,
  HealthRecord,
  HealthRecordList,
  UpdateHealthRecordRequest,
  HealthSchedule,
  HealthScheduleList,
  CreateHealthScheduleRequest,
  UpdateHealthScheduleRequest,
} from '@/types/health';
import { ListOptions } from '@/types/list';
import { currentUserId, definedFields, fetchList, throwIfError } from './supabaseList';

const RECORD_TEXT_FILTERS = ['title', 'vet_name', 'medication', 'description'];
const SCHEDULE_TEXT_FILTERS = ['name', 'description'];

export const HealthService = {
  getHealthRecords: async (farmId: string, params?: ListOptions): Promise<HealthRecordList> => {
    const supabase = createClient();
    const query = supabase
      .from('health_records')
      .select('*', { count: 'exact' })
      .eq('farm_id', farmId);

    return fetchList<HealthRecord>(query, params, {
      textFilters: RECORD_TEXT_FILTERS,
      defaultSort: { column: 'performed_at', ascending: false },
    });
  },

  getHealthRecordById: async (farmId: string, recordId: string): Promise<HealthRecord> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('health_records')
      .select('*')
      .eq('farm_id', farmId)
      .eq('id', recordId)
      .single();
    throwIfError(error);
    return data as HealthRecord;
  },

  createHealthRecord: async (
    farmId: string,
    payload: CreateHealthRecordRequest
  ): Promise<HealthRecord> => {
    const supabase = createClient();
    const userId = await currentUserId(supabase);
    const { data, error } = await supabase
      .from('health_records')
      .insert({
        ...definedFields(payload as unknown as Record<string, unknown>),
        farm_id: farmId,
        performed_by: payload.performed_by ?? userId,
      })
      .select('*')
      .single();
    throwIfError(error);
    return data as HealthRecord;
  },

  updateHealthRecord: async (
    farmId: string,
    recordId: string,
    payload: UpdateHealthRecordRequest
  ): Promise<HealthRecord> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('health_records')
      .update(definedFields(payload as Record<string, unknown>))
      .eq('farm_id', farmId)
      .eq('id', recordId)
      .select('*')
      .single();
    throwIfError(error);
    return data as HealthRecord;
  },

  deleteHealthRecord: async (farmId: string, recordId: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase
      .from('health_records')
      .delete()
      .eq('farm_id', farmId)
      .eq('id', recordId);
    throwIfError(error);
  },

  getHealthSchedules: async (farmId: string, params?: ListOptions): Promise<HealthScheduleList> => {
    const supabase = createClient();
    const query = supabase
      .from('health_schedules')
      .select('*', { count: 'exact' })
      .eq('farm_id', farmId);

    return fetchList<HealthSchedule>(query, params, {
      textFilters: SCHEDULE_TEXT_FILTERS,
      defaultSort: { column: 'start_date', ascending: false },
    });
  },

  getHealthScheduleById: async (farmId: string, scheduleId: string): Promise<HealthSchedule> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('health_schedules')
      .select('*')
      .eq('farm_id', farmId)
      .eq('id', scheduleId)
      .single();
    throwIfError(error);
    return data as HealthSchedule;
  },

  createHealthSchedule: async (
    farmId: string,
    payload: CreateHealthScheduleRequest
  ): Promise<HealthSchedule> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('health_schedules')
      .insert({
        ...definedFields(payload as unknown as Record<string, unknown>),
        farm_id: farmId,
        lead_time_days: payload.lead_time_days ?? 0,
      })
      .select('*')
      .single();
    throwIfError(error);
    return data as HealthSchedule;
  },

  updateHealthSchedule: async (
    farmId: string,
    scheduleId: string,
    payload: UpdateHealthScheduleRequest
  ): Promise<HealthSchedule> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('health_schedules')
      .update(definedFields(payload as Record<string, unknown>))
      .eq('farm_id', farmId)
      .eq('id', scheduleId)
      .select('*')
      .single();
    throwIfError(error);
    return data as HealthSchedule;
  },

  deleteHealthSchedule: async (farmId: string, scheduleId: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase
      .from('health_schedules')
      .delete()
      .eq('farm_id', farmId)
      .eq('id', scheduleId);
    throwIfError(error);
  },

  setHealthScheduleStatus: async (
    farmId: string,
    scheduleId: string,
    active: boolean
  ): Promise<HealthSchedule> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('health_schedules')
      .update({ active })
      .eq('farm_id', farmId)
      .eq('id', scheduleId)
      .select('*')
      .single();
    throwIfError(error);
    return data as HealthSchedule;
  },

  recordScheduleCompletion: async (
    farmId: string,
    scheduleId: string,
    payload: CreateHealthRecordRequest
  ): Promise<HealthRecord> => {
    const supabase = createClient();
    const schedule = await HealthService.getHealthScheduleById(farmId, scheduleId);

    // The schedule names the target; the record inherits it unless the form
    // overrode it. A one-off schedule is spent once it has been recorded.
    const record = await HealthService.createHealthRecord(farmId, {
      ...payload,
      animal_id:
        payload.animal_id ?? (schedule.target_type === 'animal' ? schedule.target_id : null),
      group_id: payload.group_id ?? (schedule.target_type === 'group' ? schedule.target_id : null),
    });

    if (schedule.frequency_type === 'once') {
      await HealthService.setHealthScheduleStatus(farmId, scheduleId, false);
    }

    return record;
  },
};
