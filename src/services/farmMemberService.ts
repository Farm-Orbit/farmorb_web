import { createClient } from '@/lib/supabase/client';
import {
  FarmMemberResponse,
  FarmInvitationResponse,
  InviteMemberRequest,
  RemoveMemberResponse,
  AcceptInvitationResponse,
} from '../types/farmMember';
import { ListOptions, PaginatedList } from '@/types/list';

function throwIfError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

function paginate<T>(items: T[], params?: ListOptions): PaginatedList<T> {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? Math.max(items.length, 1);
  const start = (page - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  return {
    items: slice,
    page,
    pageSize,
    total: items.length,
  };
}

export const FarmMemberService = {
  getFarmMembers: async (
    farmId: string,
    params?: ListOptions
  ): Promise<PaginatedList<FarmMemberResponse>> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('farm_members')
      .select('id, user_id, role, joined_at')
      .eq('farm_id', farmId)
      .order('joined_at', { ascending: true });
    throwIfError(error);

    const rows = data || [];
    const userIds = rows.map((r) => r.user_id);
    let profilesById = new Map<string, { email?: string; first_name?: string; last_name?: string; phone?: string }>();

    if (userIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, phone')
        .in('id', userIds);
      throwIfError(profileError);
      profilesById = new Map(
        (profiles || []).map((p: any) => [
          p.id,
          {
            email: p.email || undefined,
            first_name: p.first_name || undefined,
            last_name: p.last_name || undefined,
            phone: p.phone || undefined,
          },
        ])
      );
    }

    let members: FarmMemberResponse[] = rows.map((row) => {
      const profile = profilesById.get(row.user_id);
      return {
        id: row.id,
        user_id: row.user_id,
        role: row.role,
        joined_at: row.joined_at,
        email: profile?.email,
        phone: profile?.phone,
        first_name: profile?.first_name,
        last_name: profile?.last_name,
      };
    });

    const roleFilter = params?.filters?.role;
    if (roleFilter) {
      const roles = Array.isArray(roleFilter) ? roleFilter : [roleFilter];
      members = members.filter((m) => roles.includes(m.role));
    }

    return paginate(members, params);
  },

  removeFarmMember: async (farmId: string, userId: string): Promise<RemoveMemberResponse> => {
    const supabase = createClient();
    const { error } = await supabase
      .from('farm_members')
      .delete()
      .eq('farm_id', farmId)
      .eq('user_id', userId)
      .neq('role', 'owner');
    throwIfError(error);
    return { success: true, message: 'Member removed' };
  },

  updateFarmMember: async (
    farmId: string,
    userId: string,
    data: { role: string }
  ): Promise<FarmMemberResponse> => {
    if (data.role !== 'owner' && data.role !== 'member') {
      throw new Error('Role must be owner or member');
    }

    const supabase = createClient();
    const { data: member, error } = await supabase
      .from('farm_members')
      .update({ role: data.role, updated_at: new Date().toISOString() })
      .eq('farm_id', farmId)
      .eq('user_id', userId)
      .select('id, user_id, role, joined_at')
      .single();
    throwIfError(error);

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, first_name, last_name, phone')
      .eq('id', userId)
      .maybeSingle();

    return {
      id: member.id,
      user_id: member.user_id,
      role: member.role,
      joined_at: member.joined_at,
      email: profile?.email || undefined,
      phone: profile?.phone || undefined,
      first_name: profile?.first_name || undefined,
      last_name: profile?.last_name || undefined,
    };
  },

  inviteMember: async (
    farmId: string,
    data: InviteMemberRequest
  ): Promise<FarmInvitationResponse> => {
    if (!data.email) {
      throw new Error('Email is required');
    }

    const supabase = createClient();
    const { data: invitation, error } = await supabase.rpc('invite_farm_member', {
      p_farm_id: farmId,
      p_email: data.email,
      p_role: data.role || 'member',
    });
    throwIfError(error);

    const { data: farm } = await supabase
      .from('farms')
      .select('name')
      .eq('id', farmId)
      .maybeSingle();

    return {
      id: invitation.id,
      farm_id: invitation.farm_id,
      farm_name: farm?.name || 'Farm',
      email: invitation.email || undefined,
      phone: invitation.phone || undefined,
      role: invitation.role,
      status: invitation.status,
      expires_at: invitation.expires_at,
      created_at: invitation.created_at,
      accepted_at: invitation.accepted_at || undefined,
      declined_at: invitation.declined_at || undefined,
    };
  },

  getUserInvitations: async (
    params?: ListOptions & { email?: string; phone?: string }
  ): Promise<PaginatedList<FarmInvitationResponse>> => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('list_my_invitations');
    throwIfError(error);

    let invitations: FarmInvitationResponse[] = (data || []).map((row: any) => ({
      id: row.id,
      farm_id: row.farm_id,
      farm_name: row.farm_name || 'Farm',
      email: row.email || undefined,
      phone: row.phone || undefined,
      role: row.role,
      status: row.status,
      expires_at: row.expires_at,
      created_at: row.created_at,
      accepted_at: row.accepted_at || undefined,
      declined_at: row.declined_at || undefined,
    }));

    const statusFilter = params?.filters?.status;
    if (statusFilter) {
      const statuses = Array.isArray(statusFilter) ? statusFilter : [statusFilter];
      invitations = invitations.filter((i) => statuses.includes(i.status));
    } else {
      // Default list shows pending invites (accepted/declined are history)
      invitations = invitations.filter((i) => i.status === 'pending');
    }

    return paginate(invitations, params);
  },

  acceptInvitation: async (invitationId: string): Promise<AcceptInvitationResponse> => {
    const supabase = createClient();
    const { error } = await supabase.rpc('accept_farm_invitation', {
      p_invitation_id: invitationId,
    });
    throwIfError(error);
    return { success: true, message: 'Invitation accepted' };
  },

  declineInvitation: async (invitationId: string): Promise<AcceptInvitationResponse> => {
    const supabase = createClient();
    const { error } = await supabase.rpc('decline_farm_invitation', {
      p_invitation_id: invitationId,
    });
    throwIfError(error);
    return { success: true, message: 'Invitation declined' };
  },

  acceptInvitationByToken: async (_token: string): Promise<AcceptInvitationResponse> => {
    throw new Error('Token-based invite accept is not supported yet; use the invitations page');
  },
};
