import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchFarmGroups,
  fetchGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  clearGroupError,
  setCurrentGroup,
} from '@/store/slices/groupSlice';
import { CreateGroupRequest, Group, UpdateGroupRequest } from '@/types/group';
import { ListOptions } from '@/types/list';

export const useGroups = () => {
  const dispatch = useAppDispatch();
  const { groups, currentGroup, isLoading, error } = useAppSelector((state) => state.groups);

  const getFarmGroups = useCallback(
    (farmId: string, params?: ListOptions) => {
      return dispatch(fetchFarmGroups({ farmId, params })).unwrap();
    },
    [dispatch]
  );

  const getGroupById = useCallback(
    (farmId: string, groupId: string) => {
      return dispatch(fetchGroupById({ farmId, groupId })).unwrap();
    },
    [dispatch]
  );

  const addGroup = useCallback(
    (farmId: string, data: CreateGroupRequest) => {
      return dispatch(createGroup({ farmId, data })).unwrap();
    },
    [dispatch]
  );

  const editGroup = useCallback(
    (farmId: string, groupId: string, data: UpdateGroupRequest) => {
      return dispatch(updateGroup({ farmId, groupId, data })).unwrap();
    },
    [dispatch]
  );

  const removeGroup = useCallback(
    (farmId: string, groupId: string) => {
      return dispatch(deleteGroup({ farmId, groupId })).unwrap();
    },
    [dispatch]
  );

  const clearError = useCallback(() => {
    dispatch(clearGroupError());
  }, [dispatch]);

  const selectGroup = useCallback(
    (group: Group | null) => {
      dispatch(setCurrentGroup(group));
    },
    [dispatch]
  );

  return {
    groups,
    currentGroup,
    isLoading,
    error,
    getFarmGroups,
    getGroupById,
    addGroup,
    editGroup,
    removeGroup,
    clearError,
    selectGroup,
  };
};

export default useGroups;
