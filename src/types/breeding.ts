import { PaginatedList } from '@/types/list';

export type BreedingRecordType = 'heat' | 'breeding' | 'pregnancy_check' | 'birth';
export type BreedingMethod = 'natural' | 'ai' | 'embryo';
export type BreedingStatus = 'planned' | 'in_progress' | 'confirmed' | 'failed' | 'completed';

export interface BreedingRecord {
  id: string;
  farm_id: string;
  animal_id: string;
  record_type: BreedingRecordType;
  event_date: string;
  mate_id?: string | null;
  method?: BreedingMethod | null;
  status: BreedingStatus;
  gestation_days?: number | null;
  expected_due_date?: string | null;
  actual_due_date?: string | null;
  offspring_count?: number | null;
  offspring_ids?: string[];
  notes?: string | null;
  attachments?: any[];
  created_at: string;
  updated_at: string;
}

export interface CreateBreedingRecordRequest {
  animal_id: string;
  record_type: BreedingRecordType;
  event_date: string;
  mate_id?: string | null;
  method?: BreedingMethod | null;
  status: BreedingStatus;
  gestation_days?: number | null;
  expected_due_date?: string | null;
  actual_due_date?: string | null;
  offspring_count?: number | null;
  offspring_ids?: string[];
  notes?: string | null;
  attachments?: any[];
}

export interface UpdateBreedingRecordRequest extends Partial<CreateBreedingRecordRequest> {}

export interface BreedingTimelinePayload {
  animal_id: string;
  items: BreedingRecord[];
}

export type BreedingRecordList = PaginatedList<BreedingRecord>;
