import { apiClient } from './api';
import { ApiResponse } from '@/types/api';
import { Farm, CreateFarmData, UpdateFarmData } from '@/types/farm';
import { ListOptions, PaginatedList } from '@/types/list';
import { createListSearchParams, normalizePaginatedResponse } from '@/utils/pagination';

export const FarmService = {
    getFarms: async (params?: ListOptions): Promise<PaginatedList<Farm>> => {
        const searchParams = createListSearchParams(params);
        const queryString = searchParams.toString();
        const url = queryString ? `/farms?${queryString}` : '/farms';

        const { data } = await apiClient.get<ApiResponse<PaginatedList<Farm>> | PaginatedList<Farm>>(url);
        const payload = 'data' in data && data.data ? data.data : data;

        return normalizePaginatedResponse<Farm>(payload, params);
    },

    getFarmById: async (id: string): Promise<Farm> => {
        const response = await apiClient.get<any>(`/farms/${id}`);
        // Handle different response structures
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        return response.data;
    },

    createFarm: async (data: CreateFarmData): Promise<Farm> => {
        console.log('📝 Creating farm with data:', data);
        const response = await apiClient.post<any>('/farms', data);
        // Handle different response structures
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        return response.data;
    },


    updateFarm: async (id: string, data: UpdateFarmData): Promise<Farm> => {
        const response = await apiClient.put<any>(`/farms/${id}`, data);
        // Handle different response structures
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        return response.data;
    },

    deleteFarm: async (id: string): Promise<{ success: boolean }> => {
        const response = await apiClient.delete<any>(`/farms/${id}`);
        // Handle different response structures
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        return response.data;
    },
};