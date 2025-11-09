"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import {
  type MRT_ColumnDef,
  type MRT_PaginationState,
  type MRT_SortingState,
  type MRT_ColumnFiltersState,
  type MRT_TableOptions,
} from 'material-react-table';
import { Group } from '@/types/group';
import Button from '@/components/ui/button/Button';
import { useGroups } from '@/hooks/useGroups';
import { buildListOptions } from '@/utils/listOptions';

interface GroupsTableProps {
  farmId: string;
  isOwner: boolean;
}

const sortColumnMap: Record<string, string> = {
  name: 'name',
  purpose: 'purpose',
  location: 'location',
  created_at: 'created_at',
};

const filterColumnMap: Record<string, string> = {
  name: 'name',
  purpose: 'purpose',
  location: 'location',
};

export default function GroupsTable({ farmId, isOwner }: GroupsTableProps) {
  const router = useRouter();
  const { groups: storeGroups, getFarmGroups, removeGroup, isLoading: isStoreLoading, error, clearError } = useGroups();
  const [groups, setGroups] = useState<Group[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [paginationState, setPaginationState] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sortingState, setSortingState] = useState<MRT_SortingState>([]);
  const [columnFiltersState, setColumnFiltersState] = useState<MRT_ColumnFiltersState>([]);

  useEffect(() => {
    if (!isStoreLoading && storeGroups.length && groups.length === 0) {
      setGroups(storeGroups);
    }
  }, [storeGroups, isStoreLoading, groups.length]);

  const fetchGroups = useCallback(async () => {
    if (!farmId) {
      setGroups([]);
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
          location: filterLocation === 'all' ? undefined : filterLocation,
        },
      });

      const result = await getFarmGroups(farmId, params);

      if (result.items.length === 0 && result.total > 0 && paginationState.pageIndex > 0) {
        setPaginationState((prev) => ({ ...prev, pageIndex: Math.max(prev.pageIndex - 1, 0) }));
        return;
      }

      setGroups(result.items);
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
    } catch (err) {
      console.error('Failed to load groups:', err);
      setGroups([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [farmId, paginationState.pageIndex, paginationState.pageSize, sortingState, columnFiltersState, filterLocation, getFarmGroups]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleDeleteGroup = useCallback(
    async (group: Group) => {
      if (!window.confirm(`Are you sure you want to delete group ${group.name}?`)) {
        return;
      }

      try {
        await removeGroup(farmId, group.id);
        await fetchGroups();
      } catch (err) {
        console.error('Failed to delete group:', err);
      }
    },
    [farmId, removeGroup, fetchGroups]
  );

  const handleEditGroup = useCallback(
    (group: Group) => {
      router.push(`/farms/${farmId}/groups/${group.id}/edit`);
    },
    [router, farmId]
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const columns = useMemo<MRT_ColumnDef<Group>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Group Name',
        size: 220,
        filterVariant: 'text',
        Cell: ({ cell }) => (
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {cell.getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'purpose',
        header: 'Purpose',
        size: 200,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {cell.getValue<string>() || 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'location',
        header: 'Location',
        size: 180,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {cell.getValue<string>() || 'N/A'}
          </span>
        ),
        filterVariant: 'text',
      },
      {
        accessorKey: 'created_at',
        header: 'Created At',
        size: 160,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(cell.getValue<string>())}
          </span>
        ),
        enableColumnFilter: false,
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 180,
        enableColumnFilter: false,
        enableSorting: false,
        Cell: ({ row }) => {
          const group = row.original;

          if (!isOwner) {
            return <span className="text-xs text-gray-400 dark:text-gray-500">-</span>;
          }

          return (
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                size="sm"
                data-testid={`edit-group-button-${group.id}`}
                onClick={() => handleEditGroup(group)}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                data-testid={`delete-group-button-${group.id}`}
                onClick={() => handleDeleteGroup(group)}
              >
                Delete
              </Button>
            </div>
          );
        },
      },
    ],
    [handleDeleteGroup, handleEditGroup, isOwner]
  );

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => {
              clearError();
              fetchGroups();
            }}
            className="mt-2 text-sm text-red-700 dark:text-red-300 underline"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="flex justify-end items-center">
        {isOwner && (
          <Button
            onClick={() => router.push(`/farms/${farmId}/groups/new`)}
            size="sm"
            data-testid="create-group-button"
          >
            Create Group
          </Button>
        )}
      </div>

      {!isLoading && groups.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No groups found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Create a new group to start organizing your animals.
          </p>
        </div>
      ) : (
        <CustomMaterialTable
          columns={columns}
          data={groups}
          isLoading={isLoading}
          getRowId={(row) => row.id}
          enableRowSelection={false}
          enableColumnFilters
          enableGlobalFilter
          initialPageSize={paginationState.pageSize}
          renderTopToolbarCustomActions={() => (
            <div className="flex gap-2 items-center">
              <select
                value={filterLocation}
                onChange={(e) => {
                  setFilterLocation(e.target.value);
                  setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
                }}
                data-testid="group-location-filter"
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Locations</option>
              </select>
            </div>
          )}
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
          } as Partial<MRT_TableOptions<Group>>}
        />
      )}
    </div>
  );
}

