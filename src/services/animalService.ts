import { apiClient } from './api';
import { ApiResponse } from '@/types/api';
import { Animal, CreateAnimalData, UpdateAnimalData } from '@/types/animal';
import { ListOptions, PaginatedList } from '@/types/list';
import { createListSearchParams, normalizePaginatedResponse } from '@/utils/pagination';

export const AnimalService = {
    // Get all animals for a farm
    getFarmAnimals: async (farmId: string, params?: ListOptions): Promise<PaginatedList<Animal>> => {
        try {
            const searchParams = createListSearchParams(params);
            const queryString = searchParams.toString();
            const url = queryString ? `/farms/${farmId}/animals?${queryString}` : `/farms/${farmId}/animals`;

            const { data } = await apiClient.get<ApiResponse<PaginatedList<Animal>> | PaginatedList<Animal>>(url);
            const payload = 'data' in data && data.data ? data.data : data;

            return normalizePaginatedResponse<Animal>(payload, params);
        } catch (error: any) {
            const errorMessage = error?.error || error?.message || error?.response?.data?.message || 'Failed to load animals';
            const statusCode = error?.statusCode || error?.response?.status;
            
            const apiError = new Error(errorMessage);
            (apiError as any).error = error?.error || errorMessage;
            (apiError as any).message = errorMessage;
            (apiError as any).statusCode = statusCode;
            (apiError as any).details = error?.details || error?.response?.data;
            (apiError as any).farmId = farmId;
            
            throw apiError;
        }
    },

    // Get a single animal
    getAnimalById: async (farmId: string, animalId: string): Promise<Animal> => {
        const response = await apiClient.get<any>(`/farms/${farmId}/animals/${animalId}`);
        // Handle different response structures
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        return response.data;
    },

    // Create a new animal
    createAnimal: async (farmId: string, data: CreateAnimalData): Promise<Animal> => {
        console.log('🐮 Creating animal with data:', data);
        const response = await apiClient.post<any>(`/farms/${farmId}/animals`, data);
        // Handle different response structures
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        return response.data;
    },

    // Update an existing animal
    updateAnimal: async (farmId: string, animalId: string, data: Partial<CreateAnimalData & { status?: string }>): Promise<Animal> => {
        const response = await apiClient.put<any>(`/farms/${farmId}/animals/${animalId}`, data);
        // Handle different response structures
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        return response.data;
    },

    // Delete an animal
    deleteAnimal: async (farmId: string, animalId: string): Promise<void> => {
        await apiClient.delete(`/farms/${farmId}/animals/${animalId}`);
    },
};

