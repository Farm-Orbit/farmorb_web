"use client";

import { useCallback, useEffect, useState } from 'react';
import { FeedingRecord } from '@/types/feeding';
import { useFeeding } from '@/hooks/useFeeding';
import { buildListOptions } from '@/utils/listOptions';
import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/button/Button';
import { formatDate } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/currencyUtils';

interface GroupFeedingRecordsProps {
  farmId: string;
  groupId: string;
}

export default function GroupFeedingRecords({ farmId, groupId }: GroupFeedingRecordsProps) {
  const router = useRouter();
  const { getFeedingRecords } = useFeeding();
  const [records, setRecords] = useState<FeedingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    if (!farmId || !groupId) {
      setRecords([]);
      return;
    }

    setIsLoading(true);
    try {
      const params = buildListOptions({
        paginationState: { pageIndex: 0, pageSize: 100 },
        sortingState: [{ id: 'date', desc: true }],
        columnFiltersState: [],
        sortColumnMap: { date: 'date' },
        filterColumnMap: {},
        extraFilters: {
          group_id: groupId,
        },
      });

      const result = await getFeedingRecords(farmId, params);
      setRecords(result.items || []);
    } catch (error) {
      console.error('Failed to load feeding records:', error);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [farmId, groupId, getFeedingRecords]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

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
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        size: 120,
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
        accessorKey: 'cost',
        header: 'Cost',
        size: 120,
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
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {cell.getValue<string | null>() || '-'}
          </span>
        ),
      },
    ],
    []
  );

  if (isLoading) {
    return (
      <div className="text-center p-12">
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading feeding records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => router.push(`/farms/${farmId}/feeding/records/new?group_id=${groupId}`)}
          data-testid="group-feeding-create-button"
        >
          Add Feeding Record
        </Button>
      </div>

      {records.length === 0 ? (
        <div
          className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          data-testid="group-feeding-records-empty"
        >
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No feeding records</h3>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Feeding records for this group will appear here.
          </p>
        </div>
      ) : (
        <div data-testid="group-feeding-records-table">
          <CustomMaterialTable
            columns={columns}
            data={records}
            isLoading={isLoading}
            getRowId={(row) => row.id}
            enableRowSelection={false}
            enableColumnFilters={false}
            enableGlobalFilter={false}
            enablePagination={false}
          />
        </div>
      )}
    </div>
  );
}

