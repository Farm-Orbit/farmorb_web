import { apiClient } from './api';
import { ApiResponse } from '@/types/api';
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
import { createListSearchParams, normalizePaginatedResponse } from '@/utils/pagination';

export const HealthService = {
  getHealthRecords: async (farmId: string, params?: ListOptions): Promise<HealthRecordList> => {
    const searchParams = createListSearchParams(params);
    const query = searchParams.toString();
    const url = query ? `/farms/${farmId}/health-records?${query}` : `/farms/${farmId}/health-records`;

    const { data } = await apiClient.get<ApiResponse<HealthRecordList> | HealthRecordList>(url);
    const payload = 'data' in data && data.data ? data.data : data;

    return normalizePaginatedResponse<HealthRecord>(payload, params);
  },

  getHealthRecordById: async (farmId: string, recordId: string): Promise<HealthRecord> => {
    const response = await apiClient.get<ApiResponse<HealthRecord> | HealthRecord>(
      `/farms/${farmId}/health-records/${recordId}`
    );

    if ('data' in response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as HealthRecord;
  },

  createHealthRecord: async (
    farmId: string,
    payload: CreateHealthRecordRequest
  ): Promise<HealthRecord> => {
    const response = await apiClient.post<ApiResponse<HealthRecord> | HealthRecord>(
      `/farms/${farmId}/health-records`,
      payload
    );

    if ('data' in response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as HealthRecord;
  },

  updateHealthRecord: async (
    farmId: string,
    recordId: string,
    payload: UpdateHealthRecordRequest
  ): Promise<HealthRecord> => {
    const response = await apiClient.put<ApiResponse<HealthRecord> | HealthRecord>(
      `/farms/${farmId}/health-records/${recordId}`,
      payload
    );

    if ('data' in response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as HealthRecord;
  },

  deleteHealthRecord: async (farmId: string, recordId: string): Promise<void> => {
    await apiClient.delete(`/farms/${farmId}/health-records/${recordId}`);
  },

  getHealthSchedules: async (farmId: string, params?: ListOptions): Promise<HealthScheduleList> => {
    const searchParams = createListSearchParams(params);
    const query = searchParams.toString();
    const url = query ? `/farms/${farmId}/health-schedules?${query}` : `/farms/${farmId}/health-schedules`;

    const { data } = await apiClient.get<ApiResponse<HealthScheduleList> | HealthScheduleList>(url);
    const payload = 'data' in data && data.data ? data.data : data;

    return normalizePaginatedResponse<HealthSchedule>(payload, params);
  },

  getHealthScheduleById: async (farmId: string, scheduleId: string): Promise<HealthSchedule> => {
    const response = await apiClient.get<ApiResponse<HealthSchedule> | HealthSchedule>(
      `/farms/${farmId}/health-schedules/${scheduleId}`
    );

    if ('data' in response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as HealthSchedule;
  },

  createHealthSchedule: async (
    farmId: string,
    payload: CreateHealthScheduleRequest
  ): Promise<HealthSchedule> => {
    const response = await apiClient.post<ApiResponse<HealthSchedule> | HealthSchedule>(
      `/farms/${farmId}/health-schedules`,
      payload
    );

    if ('data' in response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as HealthSchedule;
  },

  updateHealthSchedule: async (
    farmId: string,
    scheduleId: string,
    payload: UpdateHealthScheduleRequest
  ): Promise<HealthSchedule> => {
    const response = await apiClient.put<ApiResponse<HealthSchedule> | HealthSchedule>(
      `/farms/${farmId}/health-schedules/${scheduleId}`,
      payload
    );

    if ('data' in response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as HealthSchedule;
  },

  deleteHealthSchedule: async (farmId: string, scheduleId: string): Promise<void> => {
    await apiClient.delete(`/farms/${farmId}/health-schedules/${scheduleId}`);
  },

  setHealthScheduleStatus: async (
    farmId: string,
    scheduleId: string,
    active: boolean
  ): Promise<HealthSchedule> => {
    const response = await apiClient.patch<ApiResponse<HealthSchedule> | HealthSchedule>(
      `/farms/${farmId}/health-schedules/${scheduleId}/status`,
      { active }
    );

    if ('data' in response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as HealthSchedule;
  },

  recordScheduleCompletion: async (
    farmId: string,
    scheduleId: string,
    payload: CreateHealthRecordRequest
  ): Promise<HealthRecord> => {
    const response = await apiClient.post<ApiResponse<HealthRecord> | HealthRecord>(
      `/farms/${farmId}/health-schedules/${scheduleId}/record`,
      payload
    );

    if ('data' in response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as HealthRecord;
  },
};
