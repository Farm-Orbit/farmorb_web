import { apiClient } from './api';
import { ApiResponse } from '@/types/api';
import {
  CreateFeedingRecordRequest,
  FeedingRecord,
  FeedingRecordList,
  UpdateFeedingRecordRequest,
} from '@/types/feeding';
import { ListOptions } from '@/types/list';
import { createListSearchParams, normalizePaginatedResponse } from '@/utils/pagination';

export const FeedingService = {
  getFeedingRecords: async (farmId: string, params?: ListOptions): Promise<FeedingRecordList> => {
    const searchParams = createListSearchParams(params);
    const query = searchParams.toString();
    const url = query ? `/farms/${farmId}/feeding-records?${query}` : `/farms/${farmId}/feeding-records`;

    const { data } = await apiClient.get<ApiResponse<FeedingRecordList> | FeedingRecordList>(url);
    const payload = 'data' in data && data.data ? data.data : data;

    return normalizePaginatedResponse<FeedingRecord>(payload, params);
  },

  getFeedingRecordById: async (farmId: string, recordId: string): Promise<FeedingRecord> => {
    const response = await apiClient.get<ApiResponse<FeedingRecord> | FeedingRecord>(
      `/farms/${farmId}/feeding-records/${recordId}`
    );

    if ('data' in response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as FeedingRecord;
  },

  createFeedingRecord: async (
    farmId: string,
    payload: CreateFeedingRecordRequest
  ): Promise<FeedingRecord> => {
    const response = await apiClient.post<ApiResponse<FeedingRecord> | FeedingRecord>(
      `/farms/${farmId}/feeding-records`,
      payload
    );

    if ('data' in response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as FeedingRecord;
  },

  updateFeedingRecord: async (
    farmId: string,
    recordId: string,
    payload: UpdateFeedingRecordRequest
  ): Promise<FeedingRecord> => {
    const response = await apiClient.put<ApiResponse<FeedingRecord> | FeedingRecord>(
      `/farms/${farmId}/feeding-records/${recordId}`,
      payload
    );

    if ('data' in response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as FeedingRecord;
  },

  deleteFeedingRecord: async (farmId: string, recordId: string): Promise<void> => {
    await apiClient.delete(`/farms/${farmId}/feeding-records/${recordId}`);
  },
};

