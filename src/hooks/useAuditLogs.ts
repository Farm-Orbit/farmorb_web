import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchFarmAuditLogs, clearAuditError, fetchFarmAuditLogById, clearCurrentAuditLog } from '@/store/slices/auditSlice';
import { AuditLogQueryParams } from '@/types/audit';

export const useAuditLogs = () => {
  const dispatch = useAppDispatch();
  const { logs, currentLog, isLoading, error } = useAppSelector((state) => state.audit);

  const getFarmAuditLogs = useCallback(
    (farmId: string, params: AuditLogQueryParams) => {
      return dispatch(fetchFarmAuditLogs({ farmId, params })).unwrap();
    },
    [dispatch]
  );

  const getFarmAuditLogById = useCallback(
    (farmId: string, logId: string) => {
      return dispatch(fetchFarmAuditLogById({ farmId, logId })).unwrap();
    },
    [dispatch]
  );

  const clearError = useCallback(() => {
    dispatch(clearAuditError());
  }, [dispatch]);

  const clearCurrentLog = useCallback(() => {
    dispatch(clearCurrentAuditLog());
  }, [dispatch]);

  return {
    logs,
    currentLog,
    isLoading,
    error,
    getFarmAuditLogs,
    getFarmAuditLogById,
    clearError,
    clearCurrentLog,
  };
};

export default useAuditLogs;

