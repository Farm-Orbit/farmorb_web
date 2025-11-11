import { apiClient } from './api';
import { ApiResponse } from '@/types/api';
import { BreedingRecord, BreedingRecordList, BreedingTimelinePayload, CreateBreedingRecordRequest, UpdateBreedingRecordRequest } from '@/types/breeding';
import { ListOptions } from '@/types/list';
import { createListSearchParams, normalizePaginatedResponse } from '@/utils/pagination';

export const BreedingService = {
  getBreedingRecords: async (farmId: string, params?: ListOptions): Promise<BreedingRecordList> => {
    const searchParams = createListSearchParams(params);
    const query = searchParams.toString();
    const url = query ? `/farms/${farmId}/breeding-records?${query}` : `/farms/${farmId}/breeding-records`;

    const { data } = await apiClient.get<ApiResponse<BreedingRecordList> | BreedingRecordList>(url);
    const payload = 'data' in data && data.data ? data.data : data;

    return normalizePaginatedResponse<BreedingRecord>(payload, params);
  },

  getBreedingRecordById: async (farmId: string, recordId: string): Promise<BreedingRecord> => {
    const response = await apiClient.get<ApiResponse<BreedingRecord> | BreedingRecord>(
      `/farms/${farmId}/breeding-records/${recordId}`
    );

    if ('data' in response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as BreedingRecord;
  },

  createBreedingRecord: async (
    farmId: string,
    payload: CreateBreedingRecordRequest
  ): Promise<BreedingRecord> => {
    const response = await apiClient.post<ApiResponse<BreedingRecord> | BreedingRecord>(
      `/farms/${farmId}/breeding-records`,
      payload
    );

    if ('data' in response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as BreedingRecord;
  },

  updateBreedingRecord: async (
    farmId: string,
    recordId: string,
    payload: UpdateBreedingRecordRequest
  ): Promise<BreedingRecord> => {
    const response = await apiClient.put<ApiResponse<BreedingRecord> | BreedingRecord>(
      `/farms/${farmId}/breeding-records/${recordId}`,
      payload
    );

    if ('data' in response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as BreedingRecord;
  },

  deleteBreedingRecord: async (farmId: string, recordId: string): Promise<void> => {
    await apiClient.delete(`/farms/${farmId}/breeding-records/${recordId}`);
  },

  getBreedingTimeline: async (
    farmId: string,
    animalId: string,
    limit?: number
  ): Promise<BreedingTimelinePayload> => {
    const searchParams = new URLSearchParams();
    if (limit && limit > 0) {
      searchParams.append('limit', String(limit));
    }
    const query = searchParams.toString();
    const url = query
      ? `/farms/${farmId}/animals/${animalId}/breeding-timeline?${query}`
      : `/farms/${farmId}/animals/${animalId}/breeding-timeline`;

    const response = await apiClient.get<ApiResponse<BreedingTimelinePayload> | BreedingTimelinePayload>(url);

    if ('data' in response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as BreedingTimelinePayload;
  },
};
