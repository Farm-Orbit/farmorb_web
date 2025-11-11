"use client";

import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import { useAnimals } from '@/hooks/useAnimals';
import { useBreeding } from '@/hooks/useBreeding';
import { GroupService } from '@/services/groupService';
import { BreedingRecord } from '@/types/breeding';
import { type MRT_ColumnDef } from 'material-react-table';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface GroupBreedingSnapshotProps {
  farmId: string;
  groupId: string;
}

const recordTypeLabels: Record<string, string> = {
  heat: 'Heat',
  breeding: 'Breeding',
  pregnancy_check: 'Pregnancy Check',
  birth: 'Birth',
};

const statusColors: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  in_progress: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
};

export default function GroupBreedingSnapshot({ farmId, groupId }: GroupBreedingSnapshotProps) {
  const router = useRouter();
  const { getBreedingRecords } = useBreeding();
  const { getAnimalById } = useAnimals();
  const [records, setRecords] = useState<BreedingRecord[]>([]);
  const [animalIds, setAnimalIds] = useState<string[]>([]);
  const [animalMap, setAnimalMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch animals in the group
  useEffect(() => {
    const fetchGroupAnimals = async () => {
      if (!groupId) return;

      try {
        const result = await GroupService.getGroupAnimals(groupId, { page: 1, pageSize: 200 });
        const ids = result.items.map((item: any) => item.animal_id);
        setAnimalIds(ids);

        // Load animal details for mapping
        const animalDetails: Record<string, string> = {};
        for (const id of ids) {
          try {
            const animal = await getAnimalById(farmId, id);
            animalDetails[id] = animal.name || animal.tag_id || id;
          } catch (error) {
            console.error(`Failed to load animal ${id}:`, error);
          }
        }
        setAnimalMap(animalDetails);
      } catch (error) {
        console.error('Failed to load group animals:', error);
      }
    };

    fetchGroupAnimals();
  }, [farmId, groupId, getAnimalById]);

  // Fetch breeding records for animals in the group
  useEffect(() => {
    const fetchBreedingRecords = async () => {
      if (!farmId || animalIds.length === 0) {
        setRecords([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch all breeding records and filter client-side for now
        // In the future, we can add group_id filtering to the API
        const result = await getBreedingRecords(farmId, {
          page: 1,
          pageSize: 200, // Get more records to filter
        });

        // Filter records for animals in this group
        const filteredRecords = result.items.filter((record) => animalIds.includes(record.animal_id));
        setRecords(filteredRecords);
      } catch (error) {
        console.error('Failed to load breeding records:', error);
        setRecords([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (animalIds.length > 0) {
      fetchBreedingRecords();
    }
  }, [farmId, animalIds, getBreedingRecords]);

  const formatDate = (value?: string | null) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const columns = useMemo<MRT_ColumnDef<BreedingRecord>[]>(
    () => [
      {
        accessorKey: 'record_type',
        header: 'Type',
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {recordTypeLabels[cell.getValue<string>()] || cell.getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'animal_id',
        header: 'Animal',
        size: 150,
        Cell: ({ cell, row }) => {
          const animalId = cell.getValue<string>();
          const animalName = animalMap[animalId] || animalId.slice(0, 8);
          return (
            <button
              type="button"
              onClick={() => router.push(`/farms/${farmId}/animals/${animalId}`)}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {animalName}
            </button>
          );
        },
      },
      {
        accessorKey: 'event_date',
        header: 'Event Date',
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-900 dark:text-white">{formatDate(cell.getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 120,
        Cell: ({ cell }) => {
          const status = cell.getValue<string>();
          return (
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          );
        },
      },
      {
        accessorKey: 'expected_due_date',
        header: 'Expected Due',
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(cell.getValue<string>())}</span>
        ),
      },
    ],
    [farmId, animalMap, router]
  );

  if (isLoading) {
    return (
      <div className="text-center p-12">
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading breeding records...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div
        className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        data-testid="group-breeding-empty"
      >
        <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No breeding records</h3>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          There are no breeding records for animals in this group.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="group-breeding-snapshot">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Breeding Snapshot</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Recent breeding records for animals in this group.
        </p>
      </div>

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
  );
}

