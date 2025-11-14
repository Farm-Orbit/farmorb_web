import { PaginatedList } from '@/types/list';

export interface FeedingRecord {
  id: string;
  farm_id: string;
  animal_id?: string | null;
  group_id?: string | null;
  inventory_item_id?: string | null;
  feed_type: string;
  amount: number;
  unit: string;
  date: string;
  cost?: number | null;
  notes?: string | null;
  performed_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFeedingRecordRequest {
  animal_id?: string | null;
  group_id?: string | null;
  inventory_item_id?: string | null;
  feed_type: string;
  amount: number;
  unit: string;
  date: string;
  cost?: number | null;
  notes?: string | null;
}

export interface UpdateFeedingRecordRequest extends Partial<CreateFeedingRecordRequest> {}

export type FeedingRecordList = PaginatedList<FeedingRecord>;

