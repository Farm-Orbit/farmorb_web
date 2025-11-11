"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/button/Button';
import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import { useHealth } from '@/hooks/useHealth';
import { useAnimals } from '@/hooks/useAnimals';
import { useGroups } from '@/hooks/useGroups';
import { HealthSchedule, HealthScheduleFrequencyType, HealthScheduleTargetType } from '@/types/health';
import { buildListOptions } from '@/utils/listOptions';
import {
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_PaginationState,
  type MRT_SortingState,
  type MRT_TableOptions,
} from 'material-react-table';
import { useRouter } from 'next/navigation';

interface HealthSchedulesTableProps {
  farmId: string;
  groupId?: string;
}

const targetTypeLabels: Record<HealthScheduleTargetType, string> = {
  animal: 'Animal',
  group: 'Group',
};

const frequencyTypeLabels: Record<HealthScheduleFrequencyType, string> = {
  once: 'One-time',
  recurring: 'Recurring',
};

const sortColumnMap: Record<string, string> = {
  created_at: 'created_at',
  start_date: 'start_date',
};

const filterColumnMap: Record<string, string> = {
  target_type: 'target_type',
  active: 'active',
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return 'N/A';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const shortId = (value?: string | null) => (value ? value.slice(0, 8) : '-');

export default function HealthSchedulesTable({ farmId, groupId }: HealthSchedulesTableProps) {
  const router = useRouter();
  const {
    schedules: storeSchedules,
    getHealthSchedules,
    removeHealthSchedule,
    toggleHealthScheduleStatus,
  } = useHealth();
  const { getFarmAnimals } = useAnimals();
  const { getFarmGroups } = useGroups();

  const [schedules, setSchedules] = useState<HealthSchedule[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetFilter, setTargetFilter] = useState<'all' | HealthScheduleTargetType>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [animalMap, setAnimalMap] = useState<Record<string, string>>({});
  const [groupMap, setGroupMap] = useState<Record<string, string>>({});
  const [paginationState, setPaginationState] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sortingState, setSortingState] = useState<MRT_SortingState>([]);
  const [columnFiltersState, setColumnFiltersState] = useState<MRT_ColumnFiltersState>([]);

  const synchronizeSchedules = useCallback(() => {
    if (storeSchedules.length > 0 || schedules.length > 0) {
      setSchedules(storeSchedules);
    }
  }, [storeSchedules, schedules.length]);

  const loadAnimalsAndGroups = useCallback(async () => {
    try {
      const [animals, groups] = await Promise.all([
        getFarmAnimals(farmId, { page: 1, pageSize: 200 }),
        getFarmGroups(farmId, { page: 1, pageSize: 200 }),
      ]);

      setAnimalMap(
        animals.items.reduce<Record<string, string>>((acc, animal) => {
          acc[animal.id] = animal.name || animal.tag_id || animal.id;
          return acc;
        }, {})
      );

      setGroupMap(
        groups.items.reduce<Record<string, string>>((acc, group) => {
          acc[group.id] = group.name || group.id;
          return acc;
        }, {})
      );
    } catch (error) {
      console.error('Failed to load animals/groups for schedules:', error);
    }
  }, [farmId, getFarmAnimals, getFarmGroups]);

  const fetchSchedules = useCallback(async () => {
    if (!farmId) {
      setSchedules([]);
      setTotal(0);
      return;
    }

    setIsLoading(true);

    try {
      const params = buildListOptions({
        paginationState,
        sortingState,
        columnFiltersState,
        sortColumnMap,
        filterColumnMap,
        extraFilters: {
          target_type: groupId ? 'group' : targetFilter === 'all' ? undefined : targetFilter,
          target_id: groupId || undefined,
          active:
            activeFilter === 'all'
              ? undefined
              : activeFilter === 'active'
              ? 'true'
              : 'false',
        },
      });

      const result = await getHealthSchedules(farmId, params);

      if (result.items.length === 0 && result.total > 0 && paginationState.pageIndex > 0) {
        setPaginationState((prev) => ({ ...prev, pageIndex: Math.max(prev.pageIndex - 1, 0) }));
        return;
      }

      setSchedules(result.items);
      setTotal(result.total);

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
    } catch (error) {
      console.error('Failed to load health schedules:', error);
      setSchedules([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [farmId, groupId, paginationState, sortingState, columnFiltersState, targetFilter, activeFilter, getHealthSchedules]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    synchronizeSchedules();
  }, [synchronizeSchedules]);

  useEffect(() => {
    loadAnimalsAndGroups();
  }, [loadAnimalsAndGroups]);

  const handleNavigateToCreate = useCallback(() => {
    router.push(`/farms/${farmId}/health/schedules/new`);
  }, [router, farmId]);

  const handleNavigateToEdit = useCallback(
    (schedule: HealthSchedule) => {
      router.push(`/farms/${farmId}/health/schedules/${schedule.id}/edit`);
    },
    [router, farmId]
  );

  const handleNavigateToCompletion = useCallback(
    (schedule: HealthSchedule) => {
      router.push(`/farms/${farmId}/health/schedules/${schedule.id}/record`);
    },
    [router, farmId]
  );

  const handleDeleteSchedule = useCallback(
    async (schedule: HealthSchedule) => {
      if (!farmId) return;

      const confirmed = window.confirm('Are you sure you want to delete this health schedule?');
      if (!confirmed) {
        return;
      }

      try {
        setIsProcessing(true);
        await removeHealthSchedule(farmId, schedule.id);
        await fetchSchedules();
      } catch (error) {
        console.error('Failed to delete health schedule:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [farmId, fetchSchedules, removeHealthSchedule]
  );

  const handleToggleStatus = useCallback(
    async (schedule: HealthSchedule) => {
      try {
        setIsProcessing(true);
        await toggleHealthScheduleStatus(farmId, schedule.id, !schedule.active);
        await fetchSchedules();
      } catch (error) {
        console.error('Failed to update schedule status:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [farmId, fetchSchedules, toggleHealthScheduleStatus]
  );

  const columns = useMemo<MRT_ColumnDef<HealthSchedule>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Schedule Name',
        size: 200,
        enableColumnFilter: false,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-900 dark:text-white">{cell.getValue<string>() || '-'}</span>
        ),
      },
      {
        id: 'target',
        header: 'Target',
        size: 160,
        enableColumnFilter: false,
        Cell: ({ row }) => {
          const targetType = row.original.target_type;
          const targetId = row.original.target_id;
          const targetLabel = targetType === 'animal' 
            ? (animalMap[targetId] || shortId(targetId))
            : (groupMap[targetId] || shortId(targetId));
          const typeLabel = targetTypeLabels[targetType] || targetType;
          return (
            <span className="text-sm text-gray-900 dark:text-white">
              {typeLabel}: {targetLabel}
            </span>
          );
        },
      },
      {
        id: 'frequency',
        header: 'Frequency',
        size: 140,
        enableColumnFilter: false,
        Cell: ({ row }) => {
          const frequencyType = frequencyTypeLabels[row.original.frequency_type] || row.original.frequency_type;
          const interval = row.original.frequency_interval_days;
          if (row.original.frequency_type === 'recurring' && interval) {
            return (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {frequencyType} ({interval}d)
              </span>
            );
          }
          return (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {frequencyType}
            </span>
          );
        },
      },
      {
        accessorKey: 'start_date',
        header: 'Start Date',
        size: 120,
        enableColumnFilter: false,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(cell.getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'active',
        header: 'Status',
        size: 100,
        Cell: ({ cell }) => {
          const isActive = cell.getValue<boolean>();
          return (
            <span
              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                isActive
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
              }`}
            >
              {isActive ? 'Active' : 'Paused'}
            </span>
          );
        },
        filterVariant: 'select',
        filterSelectOptions: [
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' },
        ],
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 280,
        enableColumnFilter: false,
        enableSorting: false,
        Cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                handleNavigateToEdit(row.original);
              }}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                handleToggleStatus(row.original);
              }}
              disabled={isProcessing}
            >
              {row.original.active ? 'Pause' : 'Activate'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                handleNavigateToCompletion(row.original);
              }}
            >
              Log
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
              onClick={(event) => {
                event.stopPropagation();
                handleDeleteSchedule(row.original);
              }}
              disabled={isProcessing}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [animalMap, groupMap, handleDeleteSchedule, handleNavigateToCompletion, handleNavigateToEdit, handleToggleStatus, isProcessing]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <select
            value={targetFilter}
            onChange={(event) => {
              setTargetFilter(event.target.value as typeof targetFilter);
              setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Targets</option>
            <option value="animal">Animal</option>
            <option value="group">Group</option>
          </select>

          <select
            value={activeFilter}
            onChange={(event) => {
              setActiveFilter(event.target.value as typeof activeFilter);
              setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <Button
          onClick={handleNavigateToCreate}
          size="sm"
          data-testid="create-health-schedule-button"
          disabled={isProcessing}
        >
          Create Schedule
        </Button>
      </div>

      {!isLoading && schedules.length === 0 ? (
        <div
          className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          data-testid="health-schedules-empty"
        >
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No health schedules configured</h3>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Create schedules to automate reminders for vaccinations, inspections, and treatments.
          </p>
        </div>
      ) : (
        <div data-testid="health-schedules-table">
          <CustomMaterialTable
            columns={columns}
            data={schedules}
            isLoading={isLoading}
            getRowId={(row) => row.id}
            enableRowSelection={false}
            enableColumnFilters
            enableGlobalFilter
            initialPageSize={paginationState.pageSize}
            additionalTableOptions={{
              manualPagination: true,
              manualSorting: true,
              manualFiltering: true,
              rowCount: total,
              onPaginationChange: setPaginationState,
              onSortingChange: setSortingState,
              onColumnFiltersChange: setColumnFiltersState,
              state: {
                pagination: paginationState,
                sorting: sortingState,
                columnFilters: columnFiltersState,
                isLoading,
              },
            } as Partial<MRT_TableOptions<HealthSchedule>>}
          />
        </div>
      )}
    </div>
  );
}
