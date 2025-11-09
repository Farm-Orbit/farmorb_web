import { apiClient } from './api';
import { ApiResponse } from '@/types/api';
import {
  Group,
  CreateGroupRequest,
  UpdateGroupRequest,
  GroupResponse,
  AddAnimalToGroupRequest,
  BulkAddAnimalsRequest,
} from '@/types/group';
import { ListOptions, PaginatedList } from '@/types/list';
import { createListSearchParams, normalizePaginatedResponse } from '@/utils/pagination';

export const GroupService = {
  // Group CRUD operations
  async getFarmGroups(farmId: string, params?: ListOptions): Promise<PaginatedList<Group>> {
    const searchParams = createListSearchParams(params);
    const queryString = searchParams.toString();
    const url = queryString ? `/farms/${farmId}/groups?${queryString}` : `/farms/${farmId}/groups`;

    const { data } = await apiClient.get<ApiResponse<PaginatedList<Group>> | PaginatedList<Group>>(url);
    const payload = 'data' in data && data.data ? data.data : data;

    return normalizePaginatedResponse<Group>(payload, params);
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

  async getGroupAnimals(groupId: string, params?: ListOptions): Promise<PaginatedList<any>> {
    const searchParams = createListSearchParams(params);
    const queryString = searchParams.toString();
    const url = queryString ? `/groups/${groupId}/animals?${queryString}` : `/groups/${groupId}/animals`;
    const { data } = await apiClient.get<ApiResponse<PaginatedList<any>> | PaginatedList<any>>(url);
    const payload = 'data' in data && data.data ? data.data : data;

    return normalizePaginatedResponse<any>(payload, params);
  },

  async getAnimalGroups(animalId: string, params?: ListOptions): Promise<PaginatedList<Group>> {
    const searchParams = createListSearchParams(params);
    const queryString = searchParams.toString();
    const url = queryString ? `/animals/${animalId}/groups?${queryString}` : `/animals/${animalId}/groups`;
    const { data } = await apiClient.get<ApiResponse<PaginatedList<Group>> | PaginatedList<Group>>(url);
    const payload = 'data' in data && data.data ? data.data : data;

    return normalizePaginatedResponse<Group>(payload, params);
  },

  async bulkAddAnimalsToGroup(groupId: string, data: BulkAddAnimalsRequest): Promise<void> {
    await apiClient.post(`/groups/${groupId}/animals`, data);
  },
};

export default GroupService;

