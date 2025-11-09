import { apiClient } from './api';
import { ApiResponse } from '@/types/api';
import {
  FarmMemberResponse,
  FarmInvitationResponse,
  InviteMemberRequest,
  InviteMemberResponse,
  AcceptInvitationResponse,
  RemoveMemberResponse,
} from '../types/farmMember';
import { ListOptions, PaginatedList } from '@/types/list';
import { createListSearchParams, normalizePaginatedResponse } from '@/utils/pagination';

export const FarmMemberService = {
  // Get farm members
  getFarmMembers: async (farmId: string, params?: ListOptions): Promise<PaginatedList<FarmMemberResponse>> => {
    const searchParams = createListSearchParams(params);
    const queryString = searchParams.toString();
    const url = queryString ? `/farms/${farmId}/members?${queryString}` : `/farms/${farmId}/members`;

    const { data } = await apiClient.get<ApiResponse<PaginatedList<FarmMemberResponse>> | PaginatedList<FarmMemberResponse>>(url);
    const payload = 'data' in data && data.data ? data.data : data;

    return normalizePaginatedResponse<FarmMemberResponse>(payload, params);
  },

  // Remove farm member
  removeFarmMember: async (farmId: string, memberId: string): Promise<RemoveMemberResponse> => {
    const response = await apiClient.delete<RemoveMemberResponse>(`/farms/${farmId}/members/${memberId}`);
    return response.data;
  },

  // Update farm member role
  updateFarmMember: async (farmId: string, memberId: string, data: { role: string }): Promise<FarmMemberResponse> => {
    const response = await apiClient.patch<{success: boolean, data: FarmMemberResponse}>(`/farms/${farmId}/members/${memberId}`, data);
    return response.data.data;
  },

  // Invite member to farm
  inviteMember: async (farmId: string, data: InviteMemberRequest): Promise<FarmInvitationResponse> => {
    const response = await apiClient.post<InviteMemberResponse>(`/farms/${farmId}/invite`, data);
    return response.data.data;
  },

  // Get user's invitations
  getUserInvitations: async (params?: ListOptions & { email?: string; phone?: string }): Promise<PaginatedList<FarmInvitationResponse>> => {
    const extra: Record<string, string | number | boolean | (string | number | boolean)[] | undefined> = {
      email: params?.email,
      phone: params?.phone,
    };
    const searchParams = createListSearchParams(params, extra);
    const queryString = searchParams.toString();
    const url = queryString ? `/invitations?${queryString}` : '/invitations';

    const { data } = await apiClient.get<ApiResponse<PaginatedList<FarmInvitationResponse>> | PaginatedList<FarmInvitationResponse>>(url);
    const payload = 'data' in data && data.data ? data.data : data;

    return normalizePaginatedResponse<FarmInvitationResponse>(payload, params);
  },

  // Accept invitation by ID
  acceptInvitation: async (invitationId: string): Promise<AcceptInvitationResponse> => {
    const response = await apiClient.post<AcceptInvitationResponse>(`/invitations/${invitationId}/accept`);
    return response.data;
  },

  // Decline invitation by ID
  declineInvitation: async (invitationId: string): Promise<AcceptInvitationResponse> => {
    const response = await apiClient.post<AcceptInvitationResponse>(`/invitations/${invitationId}/decline`);
    return response.data;
  },

  // Accept invitation by token
  acceptInvitationByToken: async (token: string): Promise<AcceptInvitationResponse> => {
    const response = await apiClient.post<AcceptInvitationResponse>('/invitations/accept', { token });
    return response.data;
  },
};
