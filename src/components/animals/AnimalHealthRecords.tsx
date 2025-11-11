"use client";

import { useCallback, useEffect, useState } from 'react';
import { HealthRecord } from '@/types/health';
import { useHealth } from '@/hooks/useHealth';
import { buildListOptions } from '@/utils/listOptions';
import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/button/Button';

interface AnimalHealthRecordsProps {
  farmId: string;
  animalId: string;
}

const recordTypeLabels: Record<string, string> = {
  treatment: 'Treatment',
  vaccination: 'Vaccination',
  inspection: 'Inspection',
  injury: 'Injury',
  note: 'Note',
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

export default function AnimalHealthRecords({ farmId, animalId }: AnimalHealthRecordsProps) {
  const router = useRouter();
  const { getHealthRecords } = useHealth();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    if (!farmId || !animalId) {
      setRecords([]);
      return;
    }

    setIsLoading(true);
    try {
      const params = buildListOptions({
        paginationState: { pageIndex: 0, pageSize: 100 },
        sortingState: [{ id: 'performed_at', desc: true }],
        columnFiltersState: [],
        sortColumnMap: { performed_at: 'performed_at' },
        filterColumnMap: {},
        extraFilters: {
          animal_id: animalId,
        },
      });

      const result = await getHealthRecords(farmId, params);
      setRecords(result.items || []);
    } catch (error) {
      console.error('Failed to load health records:', error);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [farmId, animalId, getHealthRecords]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const columns = useMemo<MRT_ColumnDef<HealthRecord>[]>(
    () => [
      {
        accessorKey: 'record_type',
        header: 'Type',
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-900 dark:text-white">
            {recordTypeLabels[cell.getValue<string>()] || cell.getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'title',
        header: 'Title',
        size: 240,
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
        accessorKey: 'vet_name',
        header: 'Vet',
        size: 140,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">{cell.getValue<string>() || '-'}</span>
        ),
      },
    ],
    []
  );

  if (isLoading) {
    return (
      <div className="text-center p-12">
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading health records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => router.push(`/farms/${farmId}/health/records/new?animal_id=${animalId}`)}
        >
          Add Health Record
        </Button>
      </div>

      {records.length === 0 ? (
        <div
          className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          data-testid="animal-health-records-empty"
        >
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No health records</h3>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Health records for this animal will appear here.
          </p>
        </div>
      ) : (
        <div data-testid="animal-health-records-table">
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

