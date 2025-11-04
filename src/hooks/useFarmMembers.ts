import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchFarmMembers,
  inviteFarmMember,
  updateFarmMemberRole,
  removeFarmMember,
  fetchMyInvitations,
  respondToInvitation,
  clearMemberError,
} from '@/store/slices/farmMemberSlice';
import { InviteMemberRequest } from '@/types/farmMember';

export const useFarmMembers = () => {
  const dispatch = useAppDispatch();
  const { members, invitations, isLoading, error } = useAppSelector((state) => state.farmMembers);

  const getFarmMembers = useCallback(
    (farmId: string) => {
      return dispatch(fetchFarmMembers(farmId)).unwrap();
    },
    [dispatch]
  );

  const inviteMember = useCallback(
    (farmId: string, data: InviteMemberRequest) => {
      return dispatch(inviteFarmMember({ farmId, data })).unwrap();
    },
    [dispatch]
  );

  const updateMemberRole = useCallback(
    (farmId: string, userId: string, role: string) => {
      return dispatch(updateFarmMemberRole({ farmId, userId, role })).unwrap();
    },
    [dispatch]
  );

  const deleteMember = useCallback(
    (farmId: string, userId: string) => {
      return dispatch(removeFarmMember({ farmId, userId })).unwrap();
    },
    [dispatch]
  );

  const getMyInvitations = useCallback((email?: string, phone?: string) => {
    return dispatch(fetchMyInvitations(email || phone ? { email, phone } : undefined)).unwrap();
  }, [dispatch]);

  const acceptInvitation = useCallback(
    (invitationId: string) => {
      return dispatch(respondToInvitation({ invitationId, accept: true })).unwrap();
    },
    [dispatch]
  );

  const declineInvitation = useCallback(
    (invitationId: string) => {
      return dispatch(respondToInvitation({ invitationId, accept: false })).unwrap();
    },
    [dispatch]
  );

  const clearError = useCallback(() => {
    dispatch(clearMemberError());
  }, [dispatch]);

  return {
    members,
    invitations,
    isLoading,
    error,
    getFarmMembers,
    inviteMember,
    updateMemberRole,
    deleteMember,
    getMyInvitations,
    acceptInvitation,
    declineInvitation,
    clearError,
  };
};

