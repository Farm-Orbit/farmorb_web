import { apiClient } from './api';
import {
  FarmMemberResponse,
  FarmInvitationResponse,
  InviteMemberRequest,
  AcceptInvitationRequest,
  GetFarmMembersResponse,
  GetUserInvitationsResponse,
  InviteMemberResponse,
  AcceptInvitationResponse,
  RemoveMemberResponse,
} from '../types/farmMember';

export const FarmMemberService = {
  // Get farm members
  getFarmMembers: async (farmId: string): Promise<FarmMemberResponse[]> => {
    const response = await apiClient.get<GetFarmMembersResponse>(`/farms/${farmId}/members`);
    return response.data.data || [];
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
  getUserInvitations: async (email?: string, phone?: string): Promise<FarmInvitationResponse[]> => {
    const params = new URLSearchParams();
    if (email) params.append('email', email);
    if (phone) params.append('phone', phone);
    
    const queryString = params.toString();
    const url = queryString ? `/invitations?${queryString}` : '/invitations';
    
    const response = await apiClient.get<GetUserInvitationsResponse>(url);
    return response.data.data || [];
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
