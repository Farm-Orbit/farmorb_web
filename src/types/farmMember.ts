// Farm Member Types
export interface FarmMember {
  id: string;
  user_id: string;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  role: string;
  joined_at: string;
}

export interface FarmMemberResponse {
  id: string;
  user_id: string;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  role: string;
  joined_at: string;
}

// Farm Invitation Types
export interface FarmInvitation {
  id: string;
  farm_id: string;
  farm_name: string;
  email?: string;
  phone?: string;
  role: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
  created_at: string;
  accepted_at?: string;
  declined_at?: string;
}

export interface FarmInvitationResponse {
  id: string;
  farm_id: string;
  farm_name: string;
  email?: string;
  phone?: string;
  role: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
  created_at: string;
  accepted_at?: string;
  declined_at?: string;
}

// Request Types
export interface InviteMemberRequest {
  email?: string;
  phone?: string;
  role: 'member';
}

// API Response Types
export interface InviteMemberResponse {
  success: boolean;
  data: FarmInvitationResponse;
  message?: string;
}

export interface AcceptInvitationResponse {
  success: boolean;
  data?: any;
  message?: string;
}

export interface RemoveMemberResponse {
  success: boolean;
  message?: string;
}

// Role Types
export type FarmRole = 'owner' | 'member';

export const FARM_ROLES: Record<FarmRole, string> = {
  owner: 'Owner',
  member: 'Member',
};

export const INVITATION_STATUSES = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
} as const;

export type InvitationStatus = keyof typeof INVITATION_STATUSES;
