"use client";

import { useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuditLogEntry } from '@/types/audit';
import { formatDate, formatRelativeTime } from '@/utils/dateUtils';
import Button from '@/components/ui/button/Button';
import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { useAuditLogs } from '@/hooks/useAuditLogs';

const getDisplayName = (log: AuditLogEntry) => {
  if (log.user && typeof log.user === 'object') {
    const rawFirst = (log.user.first_name as string) ?? (log.user.firstName as string) ?? '';
    const rawLast = (log.user.last_name as string) ?? (log.user.lastName as string) ?? '';
    const firstName = rawFirst.trim();
    const lastName = rawLast.trim();
    if (firstName || lastName) {
      return [firstName, lastName].filter(Boolean).join(' ');
    }
    const rawEmail =
      (log.user.email as string) ??
      (log.user.email_address as string) ??
      (log.user.user_email as string) ??
      '';
    const email = rawEmail.trim();
    if (email) return email;
  }
  return log.userId ?? 'Unknown user';
};

interface ChangeRow {
  field: string;
  previous?: string;
  updated?: string;
  notes?: string;
}

const AuditLogDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const farmId = params?.id as string | undefined;
  const logId = params?.logId as string | undefined;
  const { currentLog, isLoading, error, getFarmAuditLogById, clearCurrentLog, clearError } = useAuditLogs();

  useEffect(() => {
    const loadLog = async () => {
      if (!farmId || !logId) {
        clearError();
        return;
      }
      getFarmAuditLogById(farmId, logId).catch(() => null);
    };

    loadLog();
    return () => {
      clearCurrentLog();
      clearError();
    };
  }, [farmId, logId, getFarmAuditLogById, clearCurrentLog, clearError]);

  const details = useMemo(() => {
    const log = currentLog;
    if (!log) {
      return [];
    }

    return [
      { label: 'Action', value: `${log.actionType.toUpperCase()} ${log.entityType}` },
      { label: 'Entity ID', value: log.entityId ?? '—' },
      { label: 'User', value: getDisplayName(log) },
      { label: 'Recorded', value: formatDate(log.createdAt) },
      { label: 'Relative Time', value: formatRelativeTime(log.createdAt) },
      { label: 'IP Address', value: log.ipAddress ?? '—' },
      { label: 'User Agent', value: log.userAgent ?? '—' },
      { label: 'Request ID', value: log.requestId ?? '—' },
    ];
  }, [currentLog]);

  const changeRows = useMemo<ChangeRow[]>(() => {
    const log = currentLog;
    if (!log) {
      return [];
    }

    const rows: ChangeRow[] = [];

    if (log.changes && Object.keys(log.changes).length > 0) {
      Object.entries(log.changes).forEach(([field, value]) => {
        if (value && typeof value === 'object' && 'old' in value && 'new' in value) {
          const { old, new: updated } = value as Record<string, unknown>;
          rows.push({
            field,
            previous: old !== undefined && old !== null ? String(old) : '—',
            updated: updated !== undefined && updated !== null ? String(updated) : '—',
          });
        } else {
          rows.push({
            field,
            notes: String(value ?? '—'),
          });
        }
      });
    } else if (log.newValues && Object.keys(log.newValues).length > 0) {
      Object.entries(log.newValues).forEach(([field, value]) => {
        rows.push({
          field,
          previous: '—',
          updated: value !== undefined && value !== null ? String(value) : '—',
        });
      });
    } else if (log.oldValues && Object.keys(log.oldValues).length > 0) {
      Object.entries(log.oldValues).forEach(([field, value]) => {
        rows.push({
          field,
          previous: value !== undefined && value !== null ? String(value) : '—',
          updated: '—',
        });
      });
    }

    if (rows.length === 0) {
      rows.push({
        field: 'No recorded field changes',
        notes: 'This action did not capture specific field differences.',
      });
    }

    return rows;
  }, [currentLog]);

  const columns = useMemo<MRT_ColumnDef<ChangeRow>[]>(() => [
    {
      accessorKey: 'field',
      header: 'Field',
      size: 160,
      Cell: ({ row }) => (
        <span className="text-sm font-medium text-gray-900 dark:text-white">{row.original.field}</span>
      ),
    },
    {
      accessorKey: 'previous',
      header: 'Previous Value',
      size: 200,
      Cell: ({ row }) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{row.original.previous ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'updated',
      header: 'Updated Value',
      size: 200,
      Cell: ({ row }) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{row.original.updated ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'notes',
      header: 'Notes',
      size: 240,
      enableColumnActions: false,
      Cell: ({ row }) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{row.original.notes ?? '—'}</span>
      ),
    },
  ], []);

  const handleBack = () => {
    if (farmId) {
      router.push(`/farms/${farmId}?tab=activity`);
    } else {
      router.back();
    }
  };

  return (
    <div className="w-full p-6 space-y-6" data-testid="audit-log-detail-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Audit Log Details</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Review the complete context and changes recorded for this action.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleBack}>
          Back to Activity
        </Button>
      </div>

      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading audit log…</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">Unable to load audit log</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      ) : currentLog ? (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {details.map((detail) => (
                <div key={detail.label}>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {detail.label}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white mt-1 break-words">{detail.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recorded Changes</h2>
            </div>
            <CustomMaterialTable
              columns={columns}
              data={changeRows}
              enableColumnFilters={false}
              enableGlobalFilter={false}
              enableRowSelection={false}
              enablePagination={changeRows.length > 10}
              initialPageSize={10}
            />
          </div>

        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Audit log not found.</p>
        </div>
      )}
    </div>
  );
};

export default AuditLogDetailPage;

