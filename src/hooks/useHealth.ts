import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearHealthError,
  clearHealthState,
  createHealthRecord,
  createHealthSchedule,
  deleteHealthRecord,
  deleteHealthSchedule,
  fetchHealthRecordById,
  fetchHealthRecords,
  fetchHealthScheduleById,
  fetchHealthSchedules,
  recordHealthScheduleCompletion,
  setCurrentHealthRecord,
  setCurrentHealthSchedule,
  setHealthScheduleStatus,
  updateHealthRecord,
  updateHealthSchedule,
} from '@/store/slices/healthSlice';
import {
  CreateHealthRecordRequest,
  HealthRecord,
  HealthSchedule,
  CreateHealthScheduleRequest,
  UpdateHealthRecordRequest,
  UpdateHealthScheduleRequest,
} from '@/types/health';
import { ListOptions } from '@/types/list';

export const useHealth = () => {
  const dispatch = useAppDispatch();
  const {
    records,
    schedules,
    currentRecord,
    currentSchedule,
    recordsTotal,
    recordsPage,
    recordsPageSize,
    schedulesTotal,
    schedulesPage,
    schedulesPageSize,
    isLoadingRecords,
    isLoadingSchedules,
    error,
  } = useAppSelector((state) => state.health);

  const getHealthRecords = useCallback(
    (farmId: string, params?: ListOptions) =>
      dispatch(fetchHealthRecords({ farmId, params })).unwrap(),
    [dispatch]
  );

  const getHealthRecordById = useCallback(
    (farmId: string, recordId: string) =>
      dispatch(fetchHealthRecordById({ farmId, recordId })).unwrap(),
    [dispatch]
  );

  const addHealthRecord = useCallback(
    (farmId: string, data: CreateHealthRecordRequest) =>
      dispatch(createHealthRecord({ farmId, data })).unwrap(),
    [dispatch]
  );

  const editHealthRecord = useCallback(
    (farmId: string, recordId: string, data: UpdateHealthRecordRequest) =>
      dispatch(updateHealthRecord({ farmId, recordId, data })).unwrap(),
    [dispatch]
  );

  const removeHealthRecord = useCallback(
    (farmId: string, recordId: string) =>
      dispatch(deleteHealthRecord({ farmId, recordId })).unwrap(),
    [dispatch]
  );

  const logHealthScheduleCompletion = useCallback(
    (farmId: string, scheduleId: string, data: CreateHealthRecordRequest) =>
      dispatch(recordHealthScheduleCompletion({ farmId, scheduleId, data })).unwrap(),
    [dispatch]
  );

  const getHealthSchedules = useCallback(
    (farmId: string, params?: ListOptions) =>
      dispatch(fetchHealthSchedules({ farmId, params })).unwrap(),
    [dispatch]
  );

  const getHealthScheduleById = useCallback(
    (farmId: string, scheduleId: string) =>
      dispatch(fetchHealthScheduleById({ farmId, scheduleId })).unwrap(),
    [dispatch]
  );

  const addHealthSchedule = useCallback(
    (farmId: string, data: CreateHealthScheduleRequest) =>
      dispatch(createHealthSchedule({ farmId, data })).unwrap(),
    [dispatch]
  );

  const editHealthSchedule = useCallback(
    (farmId: string, scheduleId: string, data: UpdateHealthScheduleRequest) =>
      dispatch(updateHealthSchedule({ farmId, scheduleId, data })).unwrap(),
    [dispatch]
  );

  const removeHealthSchedule = useCallback(
    (farmId: string, scheduleId: string) =>
      dispatch(deleteHealthSchedule({ farmId, scheduleId })).unwrap(),
    [dispatch]
  );

  const toggleHealthScheduleStatus = useCallback(
    (farmId: string, scheduleId: string, active: boolean) =>
      dispatch(setHealthScheduleStatus({ farmId, scheduleId, active })).unwrap(),
    [dispatch]
  );

  const selectHealthRecord = useCallback(
    (record: HealthRecord | null) => {
      dispatch(setCurrentHealthRecord(record));
    },
    [dispatch]
  );

  const selectHealthSchedule = useCallback(
    (schedule: HealthSchedule | null) => {
      dispatch(setCurrentHealthSchedule(schedule));
    },
    [dispatch]
  );

  const resetHealthState = useCallback(() => {
    dispatch(clearHealthState());
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearHealthError());
  }, [dispatch]);

  return {
    records,
    schedules,
    currentRecord,
    currentSchedule,
    recordsTotal,
    recordsPage,
    recordsPageSize,
    schedulesTotal,
    schedulesPage,
    schedulesPageSize,
    isLoadingRecords,
    isLoadingSchedules,
    error,
    getHealthRecords,
    getHealthRecordById,
    addHealthRecord,
    editHealthRecord,
    removeHealthRecord,
    logHealthScheduleCompletion,
    getHealthSchedules,
    getHealthScheduleById,
    addHealthSchedule,
    editHealthSchedule,
    removeHealthSchedule,
    toggleHealthScheduleStatus,
    selectHealthRecord,
    selectHealthSchedule,
    resetHealthState,
    clearError,
  } as const;
};

export type UseHealthHook = ReturnType<typeof useHealth>;
