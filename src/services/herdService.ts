import { apiClient } from './api';
import { Herd, CreateHerdData, UpdateHerdData, HerdListResponse } from '@/types/herd';

export const HerdService = {
    // Get all herds for a farm
    getFarmHerds: async (farmId: string): Promise<Herd[]> => {
        const response = await apiClient.get<any>(`/farms/${farmId}/herds`);
        // Handle response structure: { success, message, data: [herds array] }
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        return [];
    },

    // Get a single herd
    getHerdById: async (farmId: string, herdId: string): Promise<Herd> => {
        const response = await apiClient.get<any>(`/farms/${farmId}/herds/${herdId}`);
        // Handle different response structures
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        return response.data;
    },

    // Create a new herd
    createHerd: async (farmId: string, data: CreateHerdData): Promise<Herd> => {
        console.log('🐄 Creating herd with data:', data);
        const response = await apiClient.post<any>(`/farms/${farmId}/herds`, data);
        // Handle different response structures
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        return response.data;
    },

    // Update an existing herd
    updateHerd: async (farmId: string, herdId: string, data: Partial<CreateHerdData>): Promise<Herd> => {
        const response = await apiClient.put<any>(`/farms/${farmId}/herds/${herdId}`, data);
        // Handle different response structures
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        return response.data;
    },

    // Delete a herd
    deleteHerd: async (farmId: string, herdId: string): Promise<void> => {
        await apiClient.delete(`/farms/${farmId}/herds/${herdId}`);
    },
};

