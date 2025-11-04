import { apiClient } from './api';
import {
  Group,
  CreateGroupRequest,
  UpdateGroupRequest,
  GroupResponse,
  GroupListResponse,
  AddAnimalToGroupRequest,
  BulkAddAnimalsRequest,
} from '@/types/group';

export const GroupService = {
  // Group CRUD operations
  async getFarmGroups(farmId: string): Promise<Group[]> {
    const response = await apiClient.get<GroupListResponse>(`/farms/${farmId}/groups`);
    return response.data.data;
  },

  async getGroup(farmId: string, groupId: string): Promise<Group> {
    const response = await apiClient.get<GroupResponse>(`/farms/${farmId}/groups/${groupId}`);
    return response.data.data;
  },

  async createGroup(farmId: string, data: CreateGroupRequest): Promise<Group> {
    const response = await apiClient.post<GroupResponse>(`/farms/${farmId}/groups`, data);
    return response.data.data;
  },

  async updateGroup(farmId: string, groupId: string, data: UpdateGroupRequest): Promise<Group> {
    const response = await apiClient.put<GroupResponse>(`/farms/${farmId}/groups/${groupId}`, data);
    return response.data.data;
  },

  async deleteGroup(farmId: string, groupId: string): Promise<void> {
    await apiClient.delete(`/farms/${farmId}/groups/${groupId}`);
  },

  // Animal-Group relationship operations
  async addAnimalToGroup(groupId: string, animalId: string, data?: AddAnimalToGroupRequest): Promise<void> {
    await apiClient.post(`/groups/${groupId}/animals/${animalId}`, data || {});
  },

  async removeAnimalFromGroup(groupId: string, animalId: string): Promise<void> {
    await apiClient.delete(`/groups/${groupId}/animals/${animalId}`);
  },

  async getGroupAnimals(groupId: string): Promise<any[]> {
    const response = await apiClient.get(`/groups/${groupId}/animals`);
    return response.data.data;
  },

  async getAnimalGroups(animalId: string): Promise<Group[]> {
    const response = await apiClient.get<GroupListResponse>(`/animals/${animalId}/groups`);
    return response.data.data;
  },

  async bulkAddAnimalsToGroup(groupId: string, data: BulkAddAnimalsRequest): Promise<void> {
    await apiClient.post(`/groups/${groupId}/animals`, data);
  },
};

export default GroupService;

