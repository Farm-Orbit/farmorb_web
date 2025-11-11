"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/button/Button';
import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import { useHealth } from '@/hooks/useHealth';
import { useAnimals } from '@/hooks/useAnimals';
import { useGroups } from '@/hooks/useGroups';
import { HealthRecord, HealthRecordType } from '@/types/health';
import { buildListOptions } from '@/utils/listOptions';
import {
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_PaginationState,
  type MRT_SortingState,
  type MRT_TableOptions,
} from 'material-react-table';
import { useRouter } from 'next/navigation';
import { ListOptions } from '@/types/list';

interface HealthRecordsTableProps {
  farmId: string;
}

const recordTypeLabels: Record<HealthRecordType, string> = {
  treatment: 'Treatment',
  vaccination: 'Vaccination',
  inspection: 'Inspection',
  injury: 'Injury',
  note: 'Note',
};

const sortColumnMap: Record<string, string> = {
  record_type: 'record_type',
  performed_at: 'performed_at',
  created_at: 'created_at',
};

const filterColumnMap: Record<string, string> = {
  record_type: 'record_type',
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return 'N/A';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })} ${date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
};

const shortId = (value?: string | null) => {
  if (!value) {
    return '-';
  }
  return value.slice(0, 8);
};

export default function HealthRecordsTable({ farmId }: HealthRecordsTableProps) {
  const router = useRouter();
  const { records: storeRecords, getHealthRecords, removeHealthRecord } = useHealth();
  const { getFarmAnimals } = useAnimals();
  const { getFarmGroups } = useGroups();

  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordTypeFilter, setRecordTypeFilter] = useState<'all' | HealthRecordType>('all');
  const [animalMap, setAnimalMap] = useState<Record<string, string>>({});
  const [groupMap, setGroupMap] = useState<Record<string, string>>({});
  const [paginationState, setPaginationState] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sortingState, setSortingState] = useState<MRT_SortingState>([]);
  const [columnFiltersState, setColumnFiltersState] = useState<MRT_ColumnFiltersState>([]);

  const synchronizeRecords = useCallback(() => {
    if (storeRecords.length > 0 || records.length > 0) {
      setRecords(storeRecords);
    }
  }, [storeRecords, records.length]);

  const loadAnimalsAndGroups = useCallback(async () => {
    try {
      const [animalResult, groupResult] = await Promise.all([
        getFarmAnimals(farmId, { page: 1, pageSize: 200 }),
        getFarmGroups(farmId, { page: 1, pageSize: 200 }),
      ]);

      const animalOptions = animalResult.items.reduce<Record<string, string>>((acc, animal) => {
        acc[animal.id] = animal.name || animal.tag_id || shortId(animal.id);
        return acc;
      }, {});

      const groupOptions = groupResult.items.reduce<Record<string, string>>((acc, group) => {
        acc[group.id] = group.name || shortId(group.id);
        return acc;
      }, {});

      setAnimalMap(animalOptions);
      setGroupMap(groupOptions);
    } catch (error) {
      console.error('Failed to load animal/group references for health records:', error);
    }
  }, [farmId, getFarmAnimals, getFarmGroups]);

  const fetchRecords = useCallback(async () => {
    if (!farmId) {
      setRecords([]);
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
          record_type: recordTypeFilter === 'all' ? undefined : recordTypeFilter,
        },
      });

      const result = await getHealthRecords(farmId, params);

      if (result.items.length === 0 && result.total > 0 && paginationState.pageIndex > 0) {
        setPaginationState((prev) => ({ ...prev, pageIndex: Math.max(prev.pageIndex - 1, 0) }));
        return;
      }

      setRecords(result.items);
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
      console.error('Failed to load health records:', error);
      setRecords([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [farmId, paginationState, sortingState, columnFiltersState, recordTypeFilter, getHealthRecords]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    synchronizeRecords();
  }, [synchronizeRecords]);

  useEffect(() => {
    loadAnimalsAndGroups();
  }, [loadAnimalsAndGroups]);

  const handleNavigateToCreate = useCallback(() => {
    router.push(`/farms/${farmId}/health/records/new`);
  }, [router, farmId]);

  const handleNavigateToEdit = useCallback(
    (record: HealthRecord) => {
      router.push(`/farms/${farmId}/health/records/${record.id}/edit`);
    },
    [router, farmId]
  );

  const handleDeleteRecord = useCallback(
    async (record: HealthRecord) => {
      if (!farmId) return;

      const confirmed = window.confirm('Are you sure you want to delete this health record?');
      if (!confirmed) {
        return;
      }

      try {
        setIsProcessing(true);
        await removeHealthRecord(farmId, record.id);
        await fetchRecords();
      } catch (error) {
        console.error('Failed to delete health record:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [farmId, fetchRecords, removeHealthRecord]
  );

  const columns = useMemo<MRT_ColumnDef<HealthRecord>[]>(
    () => [
      {
        accessorKey: 'record_type',
        header: 'Type',
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-900 dark:text-white">
            {recordTypeLabels[cell.getValue<HealthRecordType>()] || cell.getValue<string>()}
          </span>
        ),
        filterVariant: 'select',
        filterSelectOptions: Object.entries(recordTypeLabels).map(([value, label]) => ({ value, label })),
      },
      {
        accessorKey: 'title',
        header: 'Title',
        size: 240,
        enableColumnFilter: false,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-900 dark:text-white">{cell.getValue<string>() || '-'}</span>
        ),
      },
      {
        accessorKey: 'performed_at',
        header: 'Date',
        size: 140,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">{formatDateTime(cell.getValue<string>())}</span>
        ),
      },
      {
        id: 'target',
        header: 'Target',
        size: 160,
        enableColumnFilter: false,
        Cell: ({ row }) => {
          const animalId = row.original.animal_id;
          const groupId = row.original.group_id;
          if (animalId) {
            return (
              <span className="text-sm text-gray-900 dark:text-white">
                {animalMap[animalId] || shortId(animalId)}
              </span>
            );
          }
          if (groupId) {
            return (
              <span className="text-sm text-gray-900 dark:text-white">
                {groupMap[groupId] || shortId(groupId)}
              </span>
            );
          }
          return <span className="text-sm text-gray-500 dark:text-gray-400">-</span>;
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 140,
        enableColumnFilter: false,
        enableSorting: false,
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
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
              className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
              onClick={(event) => {
                event.stopPropagation();
                handleDeleteRecord(row.original);
              }}
              disabled={isProcessing}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [animalMap, groupMap, handleDeleteRecord, handleNavigateToEdit, isProcessing]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select
          value={recordTypeFilter}
          onChange={(event) => {
            setRecordTypeFilter(event.target.value as typeof recordTypeFilter);
            setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Record Types</option>
          {Object.entries(recordTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <Button
          onClick={handleNavigateToCreate}
          size="sm"
          data-testid="create-health-record-button"
          disabled={isProcessing}
        >
          Add Health Record
        </Button>
      </div>

      {!isLoading && records.length === 0 ? (
        <div
          className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          data-testid="health-records-empty"
        >
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No health records yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Capture treatments, vaccinations, inspections, and health events to maintain compliance.
          </p>
        </div>
      ) : (
        <div data-testid="health-records-table">
          <CustomMaterialTable
            columns={columns}
            data={records}
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
            } as Partial<MRT_TableOptions<HealthRecord>>}
          />
        </div>
      )}
    </div>
  );
}
