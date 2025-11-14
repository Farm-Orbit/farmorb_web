import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchFeedingRecords,
  fetchFeedingRecordById,
  createFeedingRecord,
  updateFeedingRecord,
  deleteFeedingRecord,
  clearFeedingError,
  setCurrentFeedingRecord,
} from '@/store/slices/feedingSlice';
import {
  FeedingRecord,
  CreateFeedingRecordRequest,
  UpdateFeedingRecordRequest,
} from '@/types/feeding';
import { ListOptions } from '@/types/list';

export const useFeeding = () => {
  const dispatch = useAppDispatch();
  const {
    records,
    currentRecord,
    recordsTotal,
    recordsPage,
    recordsPageSize,
    isLoadingRecords,
    error,
  } = useAppSelector((state) => state.feeding);

  const getFeedingRecords = useCallback(
    (farmId: string, params?: ListOptions) =>
      dispatch(fetchFeedingRecords({ farmId, params })).unwrap(),
    [dispatch]
  );

  const getFeedingRecordById = useCallback(
    (farmId: string, recordId: string) =>
      dispatch(fetchFeedingRecordById({ farmId, recordId })).unwrap(),
    [dispatch]
  );

  const addFeedingRecord = useCallback(
    (farmId: string, data: CreateFeedingRecordRequest) =>
      dispatch(createFeedingRecord({ farmId, data })).unwrap(),
    [dispatch]
  );

  const editFeedingRecord = useCallback(
    (farmId: string, recordId: string, data: UpdateFeedingRecordRequest) =>
      dispatch(updateFeedingRecord({ farmId, recordId, data })).unwrap(),
    [dispatch]
  );

  const removeFeedingRecord = useCallback(
    (farmId: string, recordId: string) =>
      dispatch(deleteFeedingRecord({ farmId, recordId })).unwrap(),
    [dispatch]
  );

  const selectFeedingRecord = useCallback(
    (record: FeedingRecord | null) => {
      dispatch(setCurrentFeedingRecord(record));
    },
    [dispatch]
  );

  const clearError = useCallback(() => {
    dispatch(clearFeedingError());
  }, [dispatch]);

  return {
    records,
    currentRecord,
    recordsTotal,
    recordsPage,
    recordsPageSize,
    isLoadingRecords,
    error,
    getFeedingRecords,
    getFeedingRecordById,
    addFeedingRecord,
    editFeedingRecord,
    removeFeedingRecord,
    selectFeedingRecord,
    clearError,
  } as const;
};

export type UseFeedingHook = ReturnType<typeof useFeeding>;

