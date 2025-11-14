"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/button/Button';
import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import { useFeeding } from '@/hooks/useFeeding';
import { useAnimals } from '@/hooks/useAnimals';
import { useGroups } from '@/hooks/useGroups';
import { useInventory } from '@/hooks/useInventory';
import { FeedingRecord } from '@/types/feeding';
import { buildListOptions } from '@/utils/listOptions';
import { formatDate } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/currencyUtils';
import {
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_PaginationState,
  type MRT_SortingState,
  type MRT_TableOptions,
} from 'material-react-table';
import { useRouter } from 'next/navigation';
import { ListOptions } from '@/types/list';

interface FeedingRecordsTableProps {
  farmId: string;
}

const sortColumnMap: Record<string, string> = {
  date: 'date',
  created_at: 'created_at',
};

const filterColumnMap: Record<string, string> = {
  feed_type: 'feed_type',
  animal_id: 'animal_id',
  group_id: 'group_id',
  inventory_item_id: 'inventory_item_id',
};

const shortId = (value?: string | null) => {
  if (!value) {
    return '-';
  }
  return value.slice(0, 8);
};

export default function FeedingRecordsTable({ farmId }: FeedingRecordsTableProps) {
  const router = useRouter();
  const { records: storeRecords, getFeedingRecords, removeFeedingRecord } = useFeeding();
  const { getFarmAnimals } = useAnimals();
  const { getFarmGroups } = useGroups();
  const { getInventoryItems } = useInventory();

  const [records, setRecords] = useState<FeedingRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [animalMap, setAnimalMap] = useState<Record<string, string>>({});
  const [groupMap, setGroupMap] = useState<Record<string, string>>({});
  const [inventoryItemMap, setInventoryItemMap] = useState<Record<string, string>>({});
  const [paginationState, setPaginationState] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sortingState, setSortingState] = useState<MRT_SortingState>([]);
  const [columnFiltersState, setColumnFiltersState] = useState<MRT_ColumnFiltersState>([]);

  const synchronizeRecords = useCallback(() => {
    if (storeRecords.length > 0 || records.length > 0) {
      setRecords(storeRecords);
    }
  }, [storeRecords, records.length]);

  const loadAnimalsGroupsAndInventory = useCallback(async () => {
    try {
      const [animalResult, groupResult, inventoryResult] = await Promise.all([
        getFarmAnimals(farmId, { page: 1, pageSize: 200 }),
        getFarmGroups(farmId, { page: 1, pageSize: 200 }),
        getInventoryItems(farmId, { page: 1, pageSize: 200 }),
      ]);

      const animalOptions = animalResult.items.reduce<Record<string, string>>((acc, animal) => {
        acc[animal.id] = animal.name || animal.tag_id || shortId(animal.id);
        return acc;
      }, {});

      const groupOptions = groupResult.items.reduce<Record<string, string>>((acc, group) => {
        acc[group.id] = group.name || shortId(group.id);
        return acc;
      }, {});

      const inventoryOptions = inventoryResult.items.reduce<Record<string, string>>((acc, item) => {
        acc[item.id] = item.name || shortId(item.id);
        return acc;
      }, {});

      setAnimalMap(animalOptions);
      setGroupMap(groupOptions);
      setInventoryItemMap(inventoryOptions);
    } catch (error) {
      console.error('Failed to load animal/group/inventory references for feeding records:', error);
    }
  }, [farmId, getFarmAnimals, getFarmGroups, getInventoryItems]);

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
      });

      const result = await getFeedingRecords(farmId, params);

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
      console.error('Failed to load feeding records:', error);
      setRecords([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [farmId, paginationState, sortingState, columnFiltersState, getFeedingRecords]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    synchronizeRecords();
  }, [synchronizeRecords]);

  useEffect(() => {
    loadAnimalsGroupsAndInventory();
  }, [loadAnimalsGroupsAndInventory]);

  const handleNavigateToEdit = useCallback(
    (record: FeedingRecord) => {
      router.push(`/farms/${farmId}/feeding/records/${record.id}/edit`);
    },
    [router, farmId]
  );

  const handleDeleteRecord = useCallback(
    async (record: FeedingRecord) => {
      if (!farmId) return;

      const confirmed = window.confirm('Are you sure you want to delete this feeding record?');
      if (!confirmed) {
        return;
      }

      try {
        setIsProcessing(true);
        await removeFeedingRecord(farmId, record.id);
        await fetchRecords();
      } catch (error) {
        console.error('Failed to delete feeding record:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [farmId, fetchRecords, removeFeedingRecord]
  );

  const columns = useMemo<MRT_ColumnDef<FeedingRecord>[]>(
    () => [
      {
        accessorKey: 'feed_type',
        header: 'Feed Type',
        size: 150,
        Cell: ({ cell }) => (
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {cell.getValue<string>() || '-'}
          </span>
        ),
        filterVariant: 'text',
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        size: 120,
        enableColumnFilter: false,
        Cell: ({ row }) => {
          const amount = row.original.amount;
          const unit = row.original.unit;
          return (
            <span className="text-sm text-gray-900 dark:text-white">
              {amount} {unit}
            </span>
          );
        },
      },
      {
        accessorKey: 'date',
        header: 'Date',
        size: 140,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(cell.getValue<string>())}
          </span>
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
        id: 'inventory_item',
        header: 'Inventory Item',
        size: 180,
        enableColumnFilter: false,
        Cell: ({ row }) => {
          const inventoryItemId = row.original.inventory_item_id;
          if (inventoryItemId) {
            return (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {inventoryItemMap[inventoryItemId] || shortId(inventoryItemId)}
              </span>
            );
          }
          return <span className="text-sm text-gray-500 dark:text-gray-400">-</span>;
        },
      },
      {
        accessorKey: 'cost',
        header: 'Cost',
        size: 120,
        enableColumnFilter: false,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatCurrency(cell.getValue<number | null>())}
          </span>
        ),
      },
      {
        accessorKey: 'notes',
        header: 'Notes',
        size: 200,
        enableColumnFilter: false,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {cell.getValue<string | null>() || '-'}
          </span>
        ),
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
    [animalMap, groupMap, inventoryItemMap, handleDeleteRecord, handleNavigateToEdit, isProcessing]
  );

  return (
    <div className="space-y-4">
      {!isLoading && records.length === 0 ? (
        <div
          className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          data-testid="feeding-records-empty"
        >
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No feeding records yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Record feeding events to track nutrition and feed consumption for your livestock.
          </p>
        </div>
      ) : (
        <div data-testid="feeding-records-table">
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
            } as Partial<MRT_TableOptions<FeedingRecord>>}
          />
        </div>
      )}
    </div>
  );
}

