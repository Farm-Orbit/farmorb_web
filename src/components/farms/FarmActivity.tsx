import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuditLogEntry, AuditLogQueryParams } from '@/types/audit';
import { formatDate, formatRelativeTime } from '@/utils/dateUtils';
import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import {
  type MRT_ColumnDef,
  type MRT_PaginationState,
  type MRT_SortingState,
  type MRT_ColumnFiltersState,
  type MRT_TableOptions,
} from 'material-react-table';
import classNames from 'classnames';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { buildListOptions } from '@/utils/listOptions';

type ActivityFilter = 'all' | 'farm' | 'animal' | 'group' | 'user';

interface FarmActivityProps {
  farmId: string;
}

interface AuditLogRow {
  id: string;
  action: string;
  readableAction: string;
  entity: string;
  user: string;
  summary: string;
  relativeTime: string;
  createdAt: string;
  log: AuditLogEntry;
}

const actionLabels: Record<string, string> = {
  create: 'created',
  update: 'updated',
  delete: 'deleted',
  read: 'viewed',
  login: 'login',
  logout: 'logout',
  password_change: 'changed password',
  password_reset: 'reset password',
};

const entityLabels: Record<string, string> = {
  farm: 'farm',
  animal: 'animal',
  group: 'group',
  user: 'user',
  invitation: 'invitation',
  auth: 'authentication',
};

const filterOptions: { value: ActivityFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'farm', label: 'Farm' },
  { value: 'animal', label: 'Animals' },
  { value: 'group', label: 'Groups' },
  { value: 'user', label: 'Users' },
];

const sortColumnMap: Record<string, string> = {
  relativeTime: 'created_at',
  action: 'action_type',
};

const filterColumnMap: Record<string, string> = {
  action: 'actions',
  entity: 'entityType',
  user: 'userId',
};

const capitalize = (value: string) => {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const getActionLabel = (log: AuditLogEntry) => {
  const action = (log.actionType ?? '').toUpperCase();
  return action || 'ACTION';
};

const getReadableAction = (log: AuditLogEntry) => {
  const actionKey = (log.actionType ?? '').toLowerCase();
  const actionLabel = actionLabels[actionKey] ?? actionKey;
  const entityLabel = entityLabels[log.entityType] ?? log.entityType ?? '';
  const combined = [actionLabel, entityLabel].filter(Boolean).join(' ').trim();
  return capitalize(combined);
};

const getUserDisplayName = (log: AuditLogEntry) => {
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

const getSummary = (log: AuditLogEntry) => {
  if (log.changes && Object.keys(log.changes).length > 0) {
    const [field, change] = Object.entries(log.changes)[0];
    if (change && typeof change === 'object' && 'old' in change && 'new' in change) {
      const { old, new: updated } = change as Record<string, unknown>;
      return `${field}: ${String(old ?? '—')} → ${String(updated ?? '—')}`;
    }
  }

  if (log.newValues && Object.keys(log.newValues).length > 0) {
    const [field, value] = Object.entries(log.newValues)[0];
    return `${field}: ${String(value ?? '—')}`;
  }

  if (log.oldValues && Object.keys(log.oldValues).length > 0) {
    const [field, value] = Object.entries(log.oldValues)[0];
    return `Previous ${field}: ${String(value ?? '—')}`;
  }

  if (log.metadata && Object.keys(log.metadata).length > 0) {
    const [field, value] = Object.entries(log.metadata)[0];
    return `Metadata ${field}: ${String(value ?? '—')}`;
  }

  return 'No additional details';
};

const FarmActivity = ({ farmId }: FarmActivityProps) => {
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [paginationState, setPaginationState] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sortingState, setSortingState] = useState<MRT_SortingState>([]);
  const [columnFiltersState, setColumnFiltersState] = useState<MRT_ColumnFiltersState>([]);
  const [totalCount, setTotalCount] = useState(0);
  const router = useRouter();
  const { logs, isLoading, error, getFarmAuditLogs } = useAuditLogs();

  useEffect(() => {
    const options = buildListOptions({
      paginationState,
      sortingState,
      columnFiltersState,
      sortColumnMap,
      filterColumnMap,
    });

    const params: AuditLogQueryParams = {
      page: options.page,
      pageSize: options.pageSize,
    };

    if (options.sortBy) {
      params.sortBy = options.sortBy;
      params.sortOrder = options.sortOrder;
    }

    const filters = options.filters ?? {};

    if (filter !== 'all') {
      params.entityType = filter;
    } else if (filters.entityType) {
      const entityValue = Array.isArray(filters.entityType) ? filters.entityType[0] : filters.entityType;
      if (entityValue) {
        params.entityType = String(entityValue).toLowerCase();
      }
    }

    if (filters.actions) {
      const values = Array.isArray(filters.actions) ? filters.actions : [filters.actions];
      params.actions = values.map((value) => String(value).toLowerCase());
    }

    if (filters.userId) {
      const user = Array.isArray(filters.userId) ? filters.userId[0] : filters.userId;
      if (user) {
        params.userId = String(user);
      }
    }

    getFarmAuditLogs(farmId, params)
      .then((result) => {
        setTotalCount(result.total ?? result.items.length);
        setPaginationState((prev) => {
          const nextPageIndex = Math.max((result.page ?? params.page ?? 1) - 1, 0);
          const nextPageSize = result.pageSize ?? params.pageSize ?? prev.pageSize;
          if (prev.pageIndex === nextPageIndex && prev.pageSize === nextPageSize) {
            return prev;
          }
          return {
            pageIndex: nextPageIndex,
            pageSize: nextPageSize,
          };
        });
      })
      .catch(() => {
        setTotalCount(0);
      });
  }, [farmId, filter, paginationState.pageIndex, paginationState.pageSize, sortingState, columnFiltersState, getFarmAuditLogs]);

  const rows = useMemo<AuditLogRow[]>(() => {
    return logs.map((log) => {
      const entityLabel = entityLabels[log.entityType] ?? log.entityType ?? '';
      return {
        id: log.id,
        action: getActionLabel(log),
        readableAction: getReadableAction(log),
        entity: (entityLabel || '').toUpperCase(),
        user: getUserDisplayName(log),
        summary: getSummary(log),
        relativeTime: formatRelativeTime(log.createdAt),
        createdAt: formatDate(log.createdAt),
        log,
      };
    });
  }, [logs]);

  const columns = useMemo<MRT_ColumnDef<AuditLogRow>[]>(() => [
    {
      accessorKey: 'action',
      header: 'Action',
      size: 180,
      Cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span
            className={classNames(
              'text-xs font-semibold tracking-wide',
              row.original.action === 'CREATE' ? 'text-green-600 dark:text-green-400' :
              row.original.action === 'UPDATE' ? 'text-blue-600 dark:text-blue-400' :
              row.original.action === 'DELETE' ? 'text-red-600 dark:text-red-400' :
              row.original.action === 'READ' ? 'text-purple-600 dark:text-purple-400' :
              'text-gray-900 dark:text-white'
            )}
          >
            {row.original.action}
          </span>
          <span className="sr-only" data-testid="audit-action-readable">
            {row.original.readableAction}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {row.original.entity}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'user',
      header: 'Actor',
      size: 160,
      Cell: ({ row }) => (
        <span className="text-sm text-gray-900 dark:text-white">{row.original.user}</span>
      ),
    },
    {
      accessorKey: 'summary',
      header: 'Summary',
      size: 280,
      Cell: ({ row }) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{row.original.summary}</span>
      ),
    },
    {
      accessorKey: 'relativeTime',
      header: 'When',
      size: 180,
      Cell: ({ row }) => (
        <div className="flex flex-col text-right">
          <span className="text-sm font-medium text-gray-900 dark:text-white">{row.original.relativeTime}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{row.original.createdAt}</span>
        </div>
      ),
    },
  ], []);

  const handleRowClick = useCallback((row: AuditLogRow) => {
    router.push(`/farms/${farmId}/audit-logs/${row.id}`);
  }, [router, farmId]);

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">Unable to load activity</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Activity</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track all changes made to this farm, including animals, groups, and membership updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="activity-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter by entity:
          </label>
          <select
            id="activity-filter"
            value={filter}
            onChange={(event) => {
              const nextFilter = event.target.value as ActivityFilter;
              setFilter(nextFilter);
              setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <CustomMaterialTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        enableRowSelection={false}
        enableColumnFilters
        enableGlobalFilter={false}
        initialPageSize={paginationState.pageSize}
        onRowClick={handleRowClick}
        renderTopToolbarCustomActions={() => null}
        additionalTableOptions={{
          manualPagination: true,
          manualSorting: true,
          manualFiltering: true,
          autoResetColumnFilters: false,
          rowCount: totalCount,
          onPaginationChange: setPaginationState,
          onSortingChange: setSortingState,
          onColumnFiltersChange: setColumnFiltersState,
          state: {
            isLoading,
            pagination: paginationState,
            sorting: sortingState,
            columnFilters: columnFiltersState,
          },
        } as Partial<MRT_TableOptions<AuditLogRow>>}
      />

      {logs.length === 0 && !isLoading && (
        <div className="rounded-md border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No activity recorded yet. Actions like creating animals or updating farm information will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default FarmActivity;

