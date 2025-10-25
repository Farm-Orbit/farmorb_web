import { apiClient } from './api';
import { ApiResponse } from '@/types/api';
import { Farm, CreateFarmData, UpdateFarmData } from '@/types/farm';

interface GetFarmsResponse {
    farms: Farm[];
}

interface GetFarmResponse extends Farm { }

interface CreateFarmResponse extends Farm { }

interface UpdateFarmResponse extends Farm { }

interface DeleteFarmResponse {
    success: boolean;
}

export const FarmService = {
    getFarms: async (): Promise<GetFarmsResponse> => {
        const response = await apiClient.get<any>('/farms');
        // Handle different response structures
        if (response.data.success && response.data.data) {
            return { farms: response.data.data };
        }
        return { farms: response.data };
    },

    getFarmById: async (id: string): Promise<GetFarmResponse> => {
        const response = await apiClient.get<any>(`/farms/${id}`);
        // Handle different response structures
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        return response.data;
    },

    createFarm: async (data: CreateFarmData): Promise<CreateFarmResponse> => {
        console.log('📝 Creating farm with data:', data);
        const response = await apiClient.post<any>('/farms', data);
        // Handle different response structures
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        return response.data;
    },


    updateFarm: async (id: string, data: UpdateFarmData): Promise<UpdateFarmResponse> => {
        const response = await apiClient.put<any>(`/farms/${id}`, data);
        // Handle different response structures
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        return response.data;
    },

    deleteFarm: async (id: string): Promise<DeleteFarmResponse> => {
        const response = await apiClient.delete<any>(`/farms/${id}`);
        // Handle different response structures
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        return response.data;
    },
};