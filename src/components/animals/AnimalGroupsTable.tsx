"use client";

import { useCallback, useEffect, useState } from 'react';
import { Group } from '@/types/group';
import { GroupService } from '@/services/groupService';
import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface AnimalGroupsTableProps {
  farmId: string;
  animalId: string;
}

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

export default function AnimalGroupsTable({ farmId, animalId }: AnimalGroupsTableProps) {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!animalId) {
      setGroups([]);
      return;
    }

    setIsLoading(true);
    try {
      const result = await GroupService.getAnimalGroups(animalId, { page: 1, pageSize: 200 });
      setGroups(result.items || []);
    } catch (error) {
      console.error('Failed to load animal groups:', error);
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, [animalId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const columns = useMemo<MRT_ColumnDef<Group>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Group Name',
        size: 200,
        Cell: ({ cell, row }) => (
          <button
            type="button"
            onClick={() => router.push(`/farms/${farmId}/groups/${row.original.id}`)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {cell.getValue<string>() || '-'}
          </button>
        ),
      },
      {
        accessorKey: 'species',
        header: 'Species',
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-900 dark:text-white">
            {cell.getValue<string>() || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'purpose',
        header: 'Purpose',
        size: 160,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {cell.getValue<string>() || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'location',
        header: 'Location',
        size: 160,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {cell.getValue<string>() || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 120,
        Cell: ({ cell }) => {
          const status = cell.getValue<string>();
          const isActive = status === 'active';
          return (
            <span
              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                isActive
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
              }`}
            >
              {status || '-'}
            </span>
          );
        },
      },
    ],
    [farmId, router]
  );

  if (isLoading) {
    return (
      <div className="text-center p-12">
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading groups...</p>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div
        className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        data-testid="animal-groups-empty"
      >
        <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No groups</h3>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          This animal is not currently assigned to any groups.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="animal-groups-table">
      <CustomMaterialTable
        columns={columns}
        data={groups}
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

