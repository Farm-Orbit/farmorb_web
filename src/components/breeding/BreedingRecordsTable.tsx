"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/button/Button';
import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import { useBreeding } from '@/hooks/useBreeding';
import { useAnimals } from '@/hooks/useAnimals';
import { BreedingRecord, BreedingRecordType, BreedingStatus } from '@/types/breeding';
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

interface BreedingRecordsTableProps {
  farmId: string;
}

const recordTypeLabels: Record<BreedingRecordType, string> = {
  heat: 'Heat',
  breeding: 'Breeding',
  pregnancy_check: 'Pregnancy Check',
  birth: 'Birth',
};

const statusLabels: Record<BreedingStatus, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  confirmed: 'Confirmed',
  failed: 'Failed',
  completed: 'Completed',
};

const statusColors: Record<BreedingStatus, string> = {
  planned: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  in_progress: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
};

const sortColumnMap: Record<string, string> = {
  record_type: 'record_type',
  event_date: 'event_date',
  status: 'status',
  created_at: 'created_at',
};

const filterColumnMap: Record<string, string> = {
  record_type: 'record_type',
  status: 'status',
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

const shortId = (value?: string | null) => {
  if (!value) {
    return '-';
  }
  return value.slice(0, 8);
};

export default function BreedingRecordsTable({ farmId }: BreedingRecordsTableProps) {
  const router = useRouter();
  const { records: storeRecords, getBreedingRecords, removeBreedingRecord } = useBreeding();
  const { getFarmAnimals, animals: animalStore } = useAnimals();

  const [records, setRecords] = useState<BreedingRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordTypeFilter, setRecordTypeFilter] = useState<'all' | BreedingRecordType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | BreedingStatus>('all');
  const [animalMap, setAnimalMap] = useState<Record<string, string>>({});
  const [paginationState, setPaginationState] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sortingState, setSortingState] = useState<MRT_SortingState>([]);
  const [columnFiltersState, setColumnFiltersState] = useState<MRT_ColumnFiltersState>([]);

  const synchronizeRecords = useCallback(() => {
    if (storeRecords.length > 0 || records.length > 0) {
      setRecords(storeRecords);
    }
  }, [storeRecords, records.length]);

  const loadAnimals = useCallback(async () => {
    try {
      const params: ListOptions = { page: 1, pageSize: 200 };
      const response = await getFarmAnimals(farmId, params);
      const map = response.items.reduce<Record<string, string>>((acc, animal) => {
        acc[animal.id] = animal.name || animal.tag_id || shortId(animal.id);
        return acc;
      }, {});
      setAnimalMap(map);
    } catch (error) {
      console.error('Failed to load animals for breeding table:', error);
    }
  }, [farmId, getFarmAnimals]);

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
          status: statusFilter === 'all' ? undefined : statusFilter,
        },
      });

      const result = await getBreedingRecords(farmId, params);

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
      console.error('Failed to load breeding records:', error);
      setRecords([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [farmId, paginationState, sortingState, columnFiltersState, recordTypeFilter, statusFilter, getBreedingRecords]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    synchronizeRecords();
  }, [synchronizeRecords]);

  useEffect(() => {
    loadAnimals();
  }, [loadAnimals, animalStore.length]);

  const handleNavigateToCreate = useCallback(() => {
    router.push(`/farms/${farmId}/breeding/new`);
  }, [router, farmId]);

  const handleNavigateToEdit = useCallback(
    (record: BreedingRecord) => {
      router.push(`/farms/${farmId}/breeding/${record.id}/edit`);
    },
    [router, farmId]
  );

  const handleDeleteRecord = useCallback(
    async (record: BreedingRecord) => {
      if (!farmId) return;

      const confirmed = window.confirm('Are you sure you want to delete this breeding record?');
      if (!confirmed) {
        return;
      }

      try {
        setIsProcessing(true);
        await removeBreedingRecord(farmId, record.id);
        await fetchRecords();
      } catch (error) {
        console.error('Failed to delete breeding record:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [farmId, fetchRecords, removeBreedingRecord]
  );

  const columns = useMemo<MRT_ColumnDef<BreedingRecord>[]>(
    () => [
      {
        accessorKey: 'record_type',
        header: 'Record Type',
        size: 160,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-900 dark:text-white">
            {recordTypeLabels[cell.getValue<BreedingRecordType>()] || cell.getValue<string>()}
          </span>
        ),
        filterVariant: 'select',
        filterSelectOptions: Object.entries(recordTypeLabels).map(([value, label]) => ({ value, label })),
      },
      {
        accessorKey: 'event_date',
        header: 'Event Date',
        size: 140,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(cell.getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 140,
        Cell: ({ cell }) => {
          const status = cell.getValue<BreedingStatus>();
          return (
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[status] || ''}`}>
              {statusLabels[status] || cell.getValue<string>()}
            </span>
          );
        },
        filterVariant: 'select',
        filterSelectOptions: Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
      },
      {
        accessorKey: 'animal_id',
        header: 'Animal',
        size: 180,
        enableColumnFilter: false,
        Cell: ({ cell }) => {
          const animalId = cell.getValue<string>();
          return (
            <span className="text-sm text-gray-900 dark:text-white">
              {animalMap[animalId] || shortId(animalId)}
            </span>
          );
        },
      },
      {
        accessorKey: 'mate_id',
        header: 'Mate',
        size: 180,
        enableColumnFilter: false,
        Cell: ({ cell }) => {
          const mateId = cell.getValue<string | null | undefined>();
          if (!mateId) {
            return <span className="text-sm text-gray-500 dark:text-gray-400">-</span>;
          }
          return (
            <span className="text-sm text-gray-900 dark:text-white">
              {animalMap[mateId] || shortId(mateId)}
            </span>
          );
        },
      },
      {
        accessorKey: 'method',
        header: 'Method',
        size: 120,
        enableColumnFilter: false,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {cell.getValue<string>() ? cell.getValue<string>()?.toUpperCase() : '-'}
          </span>
        ),
      },
      {
        accessorKey: 'expected_due_date',
        header: 'Expected Due',
        size: 150,
        enableColumnFilter: false,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(cell.getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'gestation_days',
        header: 'Gestation (Days)',
        size: 150,
        enableColumnFilter: false,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {cell.getValue<number | null>() ?? '-'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 200,
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
    [animalMap, handleDeleteRecord, handleNavigateToEdit, isProcessing]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-wrap">
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

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as typeof statusFilter);
              setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <Button onClick={handleNavigateToCreate} size="sm" data-testid="create-breeding-record-button" disabled={isProcessing}>
          Log Breeding Event
        </Button>
      </div>

      {!isLoading && records.length === 0 ? (
        <div
          className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          data-testid="breeding-records-empty"
        >
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No breeding records yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Track breeding activity to stay ahead of livestock milestones.
          </p>
        </div>
      ) : (
        <div data-testid="breeding-records-table">
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
            } as Partial<MRT_TableOptions<BreedingRecord>>}
          />
        </div>
      )}
    </div>
  );
}
