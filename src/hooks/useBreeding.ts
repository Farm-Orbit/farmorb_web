import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearBreedingError,
  clearBreedingState,
  clearTimeline,
  createBreedingRecord,
  deleteBreedingRecord,
  fetchBreedingRecordById,
  fetchBreedingRecords,
  fetchBreedingTimeline,
  setCurrentBreedingRecord,
  updateBreedingRecord,
} from '@/store/slices/breedingSlice';
import {
  BreedingRecord,
  BreedingTimelinePayload,
  CreateBreedingRecordRequest,
  UpdateBreedingRecordRequest,
} from '@/types/breeding';
import { ListOptions } from '@/types/list';

export const useBreeding = () => {
  const dispatch = useAppDispatch();
  const {
    records,
    currentRecord,
    timeline,
    total,
    page,
    pageSize,
    isLoading,
    isTimelineLoading,
    error,
  } = useAppSelector((state) => state.breeding);

  const getBreedingRecords = useCallback(
    (farmId: string, params?: ListOptions) =>
      dispatch(fetchBreedingRecords({ farmId, params })).unwrap(),
    [dispatch]
  );

  const getBreedingRecordById = useCallback(
    (farmId: string, recordId: string) =>
      dispatch(fetchBreedingRecordById({ farmId, recordId })).unwrap(),
    [dispatch]
  );

  const addBreedingRecord = useCallback(
    (farmId: string, data: CreateBreedingRecordRequest) =>
      dispatch(createBreedingRecord({ farmId, data })).unwrap(),
    [dispatch]
  );

  const editBreedingRecord = useCallback(
    (farmId: string, recordId: string, data: UpdateBreedingRecordRequest) =>
      dispatch(updateBreedingRecord({ farmId, recordId, data })).unwrap(),
    [dispatch]
  );

  const removeBreedingRecord = useCallback(
    (farmId: string, recordId: string) =>
      dispatch(deleteBreedingRecord({ farmId, recordId })).unwrap(),
    [dispatch]
  );

  const getBreedingTimeline = useCallback(
    (farmId: string, animalId: string, limit?: number) =>
      dispatch(fetchBreedingTimeline({ farmId, animalId, limit })).unwrap(),
    [dispatch]
  );

  const selectBreedingRecord = useCallback(
    (record: BreedingRecord | null) => {
      dispatch(setCurrentBreedingRecord(record));
    },
    [dispatch]
  );

  const resetBreedingState = useCallback(() => {
    dispatch(clearBreedingState());
  }, [dispatch]);

  const resetBreedingTimeline = useCallback(() => {
    dispatch(clearTimeline());
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearBreedingError());
  }, [dispatch]);

  return {
    records,
    currentRecord,
    timeline,
    total,
    page,
    pageSize,
    isLoading,
    isTimelineLoading,
    error,
    getBreedingRecords,
    getBreedingRecordById,
    addBreedingRecord,
    editBreedingRecord,
    removeBreedingRecord,
    getBreedingTimeline,
    selectBreedingRecord,
    resetBreedingState,
    resetBreedingTimeline,
    clearError,
  } as const;
};

export type UseBreedingHook = ReturnType<typeof useBreeding>;
