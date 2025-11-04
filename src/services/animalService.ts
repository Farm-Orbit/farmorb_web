import { apiClient } from './api';
import { Animal, CreateAnimalData, UpdateAnimalData, AnimalListResponse } from '@/types/animal';

export const AnimalService = {
    // Get all animals for a farm
    getFarmAnimals: async (farmId: string): Promise<Animal[]> => {
        const response = await apiClient.get<any>(`/farms/${farmId}/animals`);
        // Handle response structure: { success, message, data: [animals array] }
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        return [];
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

