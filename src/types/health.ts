import { PaginatedList } from '@/types/list';

export type HealthRecordType = 'treatment' | 'vaccination' | 'inspection' | 'injury' | 'note';
export type HealthScheduleTargetType = 'animal' | 'group';
export type HealthScheduleFrequencyType = 'once' | 'recurring';

export interface HealthRecord {
  id: string;
  farm_id: string;
  animal_id?: string | null;
  group_id?: string | null;
  record_type: HealthRecordType;
  title: string;
  description?: string | null;
  performed_at: string;
  performed_by?: string | null;
  vet_name?: string | null;
  medication?: string | null;
  dosage?: string | null;
  withdrawal_period_days?: number | null;
  cost?: number | null;
  attachments?: any[];
  follow_up_date?: string | null;
  outcome?: string | null;
  health_score?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateHealthRecordRequest {
  animal_id?: string | null;
  group_id?: string | null;
  record_type: HealthRecordType;
  title: string;
  description?: string | null;
  performed_at: string;
  performed_by?: string | null;
  vet_name?: string | null;
  medication?: string | null;
  dosage?: string | null;
  withdrawal_period_days?: number | null;
  cost?: number | null;
  attachments?: any[];
  follow_up_date?: string | null;
  outcome?: string | null;
  health_score?: number | null;
  notes?: string | null;
}

export interface UpdateHealthRecordRequest extends Partial<CreateHealthRecordRequest> {}

export interface HealthSchedule {
  id: string;
  farm_id: string;
  target_type: HealthScheduleTargetType;
  target_id: string;
  name: string;
  description?: string | null;
  frequency_type: HealthScheduleFrequencyType;
  frequency_interval_days?: number | null;
  start_date: string;
  lead_time_days: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateHealthScheduleRequest {
  target_type: HealthScheduleTargetType;
  target_id: string;
  name: string;
  description?: string | null;
  frequency_type: HealthScheduleFrequencyType;
  frequency_interval_days?: number | null;
  start_date: string;
  lead_time_days?: number;
}

export interface UpdateHealthScheduleRequest extends Partial<CreateHealthScheduleRequest> {}

export interface ScheduleStatusRequest {
  active: boolean;
}

export type HealthRecordList = PaginatedList<HealthRecord>;
export type HealthScheduleList = PaginatedList<HealthSchedule>;
