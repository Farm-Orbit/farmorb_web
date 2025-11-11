"use client";

import { useCallback, useEffect, useState } from 'react';
import { BreedingRecord } from '@/types/breeding';
import { useBreeding } from '@/hooks/useBreeding';
import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/button/Button';
import { useAnimals } from '@/hooks/useAnimals';

interface AnimalBreedingTimelineProps {
  farmId: string;
  animalId: string;
}

const recordTypeLabels: Record<string, string> = {
  heat: 'Heat',
  breeding: 'Breeding',
  pregnancy_check: 'Pregnancy Check',
  birth: 'Birth',
};

const statusLabels: Record<string, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  confirmed: 'Confirmed',
  failed: 'Failed',
  completed: 'Completed',
};

const statusColors: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  in_progress: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
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

export default function AnimalBreedingTimeline({ farmId, animalId }: AnimalBreedingTimelineProps) {
  const router = useRouter();
  const { getBreedingTimeline } = useBreeding();
  const { getFarmAnimals } = useAnimals();
  const [records, setRecords] = useState<BreedingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [animalMap, setAnimalMap] = useState<Record<string, string>>({});

  const loadAnimals = useCallback(async () => {
    try {
      const result = await getFarmAnimals(farmId, { page: 1, pageSize: 200 });
      const animals = result.items.reduce<Record<string, string>>((acc, animal) => {
        acc[animal.id] = animal.name || animal.tag_id || animal.id;
        return acc;
      }, {});
      setAnimalMap(animals);
    } catch (error) {
      console.error('Failed to load animals for breeding timeline:', error);
    }
  }, [farmId, getFarmAnimals]);

  const fetchTimeline = useCallback(async () => {
    if (!farmId || !animalId) {
      setRecords([]);
      return;
    }

    setIsLoading(true);
    try {
      const result = await getBreedingTimeline(farmId, animalId, 100);
      setRecords(result.items || []);
    } catch (error) {
      console.error('Failed to load breeding timeline:', error);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [farmId, animalId, getBreedingTimeline]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  useEffect(() => {
    loadAnimals();
  }, [loadAnimals]);

  const columns = useMemo<MRT_ColumnDef<BreedingRecord>[]>(
    () => [
      {
        accessorKey: 'record_type',
        header: 'Type',
        size: 140,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-900 dark:text-white">
            {recordTypeLabels[cell.getValue<string>()] || cell.getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'event_date',
        header: 'Event Date',
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(cell.getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'mate_id',
        header: 'Mate',
        size: 160,
        Cell: ({ cell }) => {
          const mateId = cell.getValue<string | undefined | null>();
          if (!mateId) {
            return <span className="text-sm text-gray-500 dark:text-gray-400">-</span>;
          }
          return (
            <span className="text-sm text-gray-900 dark:text-white">
              {animalMap[mateId] || mateId.slice(0, 8)}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 120,
        Cell: ({ cell }) => {
          const status = cell.getValue<string>();
          return (
            <span
              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                statusColors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
              }`}
            >
              {statusLabels[status] || status}
            </span>
          );
        },
      },
      {
        accessorKey: 'expected_due_date',
        header: 'Due Date',
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(cell.getValue<string | undefined | null>())}
          </span>
        ),
      },
    ],
    [animalMap]
  );

  if (isLoading) {
    return (
      <div className="text-center p-12">
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading breeding timeline...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => router.push(`/farms/${farmId}/breeding/new?animal_id=${animalId}`)}
        >
          Add Breeding Record
        </Button>
      </div>

      {records.length === 0 ? (
        <div
          className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          data-testid="animal-breeding-timeline-empty"
        >
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No breeding records</h3>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Breeding timeline for this animal will appear here.
          </p>
        </div>
      ) : (
        <div data-testid="animal-breeding-timeline-table">
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

