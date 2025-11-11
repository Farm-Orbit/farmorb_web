"use client";

import Button from '@/components/ui/button/Button';
import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import { useAnimals } from '@/hooks/useAnimals';
import { Animal } from '@/types/animal';
import { buildListOptions } from '@/utils/listOptions';
import {
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_PaginationState,
  type MRT_SortingState,
  type MRT_TableOptions,
} from 'material-react-table';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface AnimalsTableProps {
  farmId: string;
}

const statusLabels: Record<string, string> = {
  active: 'Active',
  sold: 'Sold',
  deceased: 'Deceased',
  culled: 'Culled',
};

const sortColumnMap: Record<string, string> = {
  tag_id: 'tag_id',
  name: 'name',
  breed: 'breed',
  sex: 'sex',
  birth_date: 'birth_date',
  status: 'status',
};

const filterColumnMap: Record<string, string> = {
  tag_id: 'tag_id',
  name: 'name',
  breed: 'breed',
  sex: 'sex',
  status: 'status',
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'sold':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'deceased':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    case 'culled':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

export default function AnimalsTable({ farmId }: AnimalsTableProps) {
  const router = useRouter();
  const {
    animals: storeAnimals,
    getFarmAnimals,
    removeAnimal,
  } = useAnimals();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paginationState, setPaginationState] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sortingState, setSortingState] = useState<MRT_SortingState>([]);
  const [columnFiltersState, setColumnFiltersState] = useState<MRT_ColumnFiltersState>([]);

  const syncAnimalsFromStore = useCallback(() => {
    if (storeAnimals.length > 0 || animals.length > 0) {
      setAnimals(storeAnimals);
    }
  }, [storeAnimals, animals.length]);

  const fetchAnimals = useCallback(async () => {
    if (!farmId) {
      setAnimals([]);
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
          status: filterStatus === 'all' ? undefined : filterStatus,
        },
      });

      const result = await getFarmAnimals(farmId, params);

      if (result.items.length === 0 && result.total > 0 && paginationState.pageIndex > 0) {
        setPaginationState((prev) => ({ ...prev, pageIndex: Math.max(prev.pageIndex - 1, 0) }));
        return;
      }

      setAnimals(result.items);
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
    } catch (error: any) {
      const errorMessage = error?.error || error?.message || 'Failed to load animals';
      console.error('Failed to load animals:', errorMessage);
      setAnimals([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [farmId, paginationState.pageIndex, paginationState.pageSize, sortingState, columnFiltersState, filterStatus, getFarmAnimals]);

  useEffect(() => {
    fetchAnimals();
  }, [fetchAnimals]);

  useEffect(() => {
    syncAnimalsFromStore();
  }, [syncAnimalsFromStore]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleNavigateToCreate = useCallback(() => {
    router.push(`/farms/${farmId}/animals/new`);
  }, [router, farmId]);

  const handleNavigateToEdit = useCallback(
    (animal: Animal) => {
      router.push(`/farms/${farmId}/animals/${animal.id}/edit`);
    },
    [router, farmId]
  );

  const handleNavigateToDetail = useCallback(
    (animal: Animal) => {
      router.push(`/farms/${farmId}/animals/${animal.id}`);
    },
    [router, farmId]
  );

  const handleDeleteClick = useCallback(
    async (animal: Animal) => {
      if (!farmId) return;

      const confirmed = window.confirm(`Are you sure you want to delete animal ${animal.tag_id}?`);
      if (!confirmed) {
        return;
      }

      try {
        setIsProcessing(true);
        await removeAnimal(farmId, animal.id);
        await fetchAnimals();
      } catch (error) {
        console.error('Failed to delete animal:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [farmId, fetchAnimals, removeAnimal]
  );

  const columns = useMemo<MRT_ColumnDef<Animal>[]>(
    () => [
      {
        accessorKey: 'tag_id',
        header: 'Tag ID',
        size: 120,
        Cell: ({ cell, row }) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNavigateToDetail(row.original);
            }}
            className="text-sm font-mono font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {cell.getValue<string>()}
          </button>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        size: 150,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-900 dark:text-white">
            {cell.getValue<string>() || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'breed',
        header: 'Breed',
        size: 130,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {cell.getValue<string>() || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'sex',
        header: 'Sex',
        size: 100,
        Cell: ({ cell }) => {
          const sex = cell.getValue<string>();
          return (
            <span className="text-sm text-gray-900 dark:text-white">
              {sex === 'male' ? '♂ Male' : '♀ Female'}
            </span>
          );
        },
      },
      {
        accessorKey: 'birth_date',
        header: 'Birth Date',
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(cell.getValue<string>())}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 120,
        Cell: ({ cell }) => {
          const status = cell.getValue<string>();
          return (
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
              {statusLabels[status] || status}
            </span>
          );
        },
        filterVariant: 'select',
        filterSelectOptions: Object.entries(statusLabels).map(([value, label]) => ({
          value,
          label,
        })),
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 160,
        enableColumnFilter: false,
        enableSorting: false,
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              data-testid={`edit-animal-button-${row.original.tag_id}`}
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
              data-testid={`delete-animal-button-${row.original.tag_id}`}
              onClick={(event) => {
                event.stopPropagation();
                handleDeleteClick(row.original);
              }}
              disabled={isProcessing}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [handleNavigateToEdit, handleNavigateToDetail, handleDeleteClick, isProcessing]
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end items-center">
        <Button
          onClick={handleNavigateToCreate}
          size="sm"
          data-testid="create-animal-button"
          disabled={isProcessing}
        >
          Add Animal
        </Button>
      </div>

      {!isLoading && animals.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No animals found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Get started by adding your first animal
          </p>
        </div>
      ) : (
        <CustomMaterialTable
          columns={columns}
          data={animals}
          isLoading={isLoading}
          getRowId={(row) => row.id}
          enableRowSelection={false}
          enableColumnFilters
          enableGlobalFilter
          initialPageSize={paginationState.pageSize}
          renderTopToolbarCustomActions={() => (
            <div className="flex gap-2 items-center">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
                }}
                data-testid="animal-status-filter"
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="sold">Sold</option>
                <option value="deceased">Deceased</option>
                <option value="culled">Culled</option>
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
          } as Partial<MRT_TableOptions<Animal>>}
        />
      )}
    </div>
  );
}

