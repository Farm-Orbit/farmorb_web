"use client";

import { useCallback, useEffect, useState } from 'react';
import { AnimalMovement } from '@/types/animal';
import { AnimalService } from '@/services/animalService';
import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { useMemo } from 'react';
import { useGroups } from '@/hooks/useGroups';

interface AnimalMovementsTableProps {
  farmId: string;
  animalId: string;
}

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

export default function AnimalMovementsTable({ farmId, animalId }: AnimalMovementsTableProps) {
  const { getFarmGroups } = useGroups();
  const [movements, setMovements] = useState<AnimalMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [groupMap, setGroupMap] = useState<Record<string, string>>({});

  const loadGroups = useCallback(async () => {
    try {
      const result = await getFarmGroups(farmId, { page: 1, pageSize: 200 });
      const groups = result.items.reduce<Record<string, string>>((acc, group) => {
        acc[group.id] = group.name || group.id;
        return acc;
      }, {});
      setGroupMap(groups);
    } catch (error) {
      console.error('Failed to load groups for movements:', error);
    }
  }, [farmId, getFarmGroups]);

  const fetchMovements = useCallback(async () => {
    if (!farmId || !animalId) {
      setMovements([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await AnimalService.getAnimalMovements(farmId, animalId, 100);
      setMovements(data || []);
    } catch (error) {
      console.error('Failed to load animal movements:', error);
      setMovements([]);
    } finally {
      setIsLoading(false);
    }
  }, [farmId, animalId]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const columns = useMemo<MRT_ColumnDef<AnimalMovement>[]>(
    () => [
      {
        accessorKey: 'moved_at',
        header: 'Date',
        size: 160,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatDateTime(cell.getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'from_group_id',
        header: 'From Group',
        size: 160,
        Cell: ({ cell }) => {
          const groupId = cell.getValue<string | undefined | null>();
          if (!groupId) {
            return <span className="text-sm text-gray-500 dark:text-gray-400">-</span>;
          }
          return (
            <span className="text-sm text-gray-900 dark:text-white">
              {groupMap[groupId] || groupId.slice(0, 8)}
            </span>
          );
        },
      },
      {
        accessorKey: 'to_group_id',
        header: 'To Group',
        size: 160,
        Cell: ({ cell }) => {
          const groupId = cell.getValue<string | undefined | null>();
          if (!groupId) {
            return <span className="text-sm text-gray-500 dark:text-gray-400">-</span>;
          }
          return (
            <span className="text-sm text-gray-900 dark:text-white">
              {groupMap[groupId] || groupId.slice(0, 8)}
            </span>
          );
        },
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        size: 180,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-900 dark:text-white">
            {cell.getValue<string>() || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'notes',
        header: 'Notes',
        size: 200,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {cell.getValue<string>() || '-'}
          </span>
        ),
      },
    ],
    [groupMap]
  );

  if (isLoading) {
    return (
      <div className="text-center p-12">
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading movements...</p>
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div
        className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        data-testid="animal-movements-empty"
      >
        <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No movements recorded</h3>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Movement history will appear here when this animal is moved between groups.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="animal-movements-table">
      <CustomMaterialTable
        columns={columns}
        data={movements}
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

