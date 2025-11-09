"use client";

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFarms } from '@/hooks/useFarms';
import Button from '@/components/ui/button/Button';
import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import {
  type MRT_ColumnDef,
  type MRT_PaginationState,
  type MRT_SortingState,
  type MRT_ColumnFiltersState,
  type MRT_TableOptions,
} from 'material-react-table';
import { Farm } from '@/types/farm';
import { ListOptions } from '@/types/list';
import { buildListOptions } from '@/utils/listOptions';

interface FarmListProps {}

const farmTypeLabels: Record<string, string> = {
  crop: 'Crop',
  livestock: 'Livestock',
  mixed: 'Mixed',
  dairy: 'Dairy',
  poultry: 'Poultry',
  other: 'Other',
};

const sortColumnMap: Record<string, string> = {
  name: 'name',
  location_address: 'location_address',
  farm_type: 'farm_type',
  is_active: 'is_active',
};

const filterColumnMap: Record<string, string> = {
  name: 'name',
  location_address: 'location_address',
  farm_type: 'farm_type',
  is_active: 'is_active',
};

export default function FarmList({}: FarmListProps) {
  const router = useRouter();
  const {
    farms,
    isLoading,
    error,
    page,
    pageSize,
    total,
    getFarms,
  } = useFarms();

  const [filterType, setFilterType] = useState<string>('all');
  const [sortingState, setSortingState] = useState<MRT_SortingState>([]);
  const [columnFiltersState, setColumnFiltersState] = useState<MRT_ColumnFiltersState>([]);
  const [paginationState, setPaginationState] = useState<MRT_PaginationState>({
    pageIndex: Math.max((page ?? 1) - 1, 0),
    pageSize: pageSize || 10,
  });

  const buildParams = useCallback((): ListOptions => {
    return buildListOptions({
      paginationState,
      sortingState,
      columnFiltersState,
      sortColumnMap,
      filterColumnMap,
      extraFilters: {
        farm_type: filterType === 'all' ? undefined : filterType,
      },
    });
  }, [paginationState, sortingState, columnFiltersState, filterType]);

  useEffect(() => {
    const params = buildParams();
    getFarms(params);
  }, [buildParams, getFarms]);

  useEffect(() => {
    setPaginationState((prev) => {
      const nextPageIndex = Math.max((page ?? 1) - 1, 0);
      const nextPageSize = pageSize || prev.pageSize;
      if (prev.pageIndex === nextPageIndex && prev.pageSize === nextPageSize) {
        return prev;
      }
      return {
        pageIndex: nextPageIndex,
        pageSize: nextPageSize,
      };
    });
  }, [page, pageSize]);

  const columns = useMemo<MRT_ColumnDef<Farm>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Farm',
        size: 200,
        Cell: ({ row }) => (
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {row.original.name || 'Unnamed Farm'}
          </span>
        ),
      },
      {
        accessorKey: 'location_address',
        header: 'Location',
        size: 250,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {cell.getValue<string>() || 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'farm_type',
        header: 'Type',
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-900 dark:text-white">
            {farmTypeLabels[cell.getValue<string>()] || cell.getValue<string>()}
          </span>
        ),
        filterVariant: 'select',
        filterSelectOptions: Object.entries(farmTypeLabels).map(([value, label]) => ({
          value,
          label,
        })),
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        size: 120,
        Cell: ({ cell }) => {
          const isActive = cell.getValue<boolean>();
          return (
            <span
              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                isActive
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
              }`}
            >
              {isActive ? 'Active' : 'Inactive'}
            </span>
          );
        },
        filterVariant: 'checkbox',
      },
      {
        accessorFn: (row) => {
          if (row.size_acres) return `${row.size_acres} acres`;
          if (row.size_hectares) return `${row.size_hectares} ha`;
          return 'N/A';
        },
        header: 'Size',
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {cell.getValue<string>()}
          </span>
        ),
        enableColumnFilter: false,
      },
    ], []
  );

  const handleFarmClick = (farm: Farm) => {
    router.push(`/farms/${farm.id}`);
  };

  return (
    <div className="space-y-4" data-testid="farms-page">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Farms</h1>
        <Button
          onClick={() => router.push('/farms/create')}
          data-testid="create-farm-button"
          size="sm"
        >
          Add Farm
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800 mb-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {!isLoading && farms.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No farms found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Get started by creating your first farm
          </p>
        </div>
      ) : (
        <CustomMaterialTable
          columns={columns}
          data={farms}
          isLoading={isLoading}
          onRowClick={handleFarmClick}
          getRowId={(row) => row.id}
          enableColumnFilters
          enableGlobalFilter={false}
          initialPageSize={paginationState.pageSize}
          renderTopToolbarCustomActions={() => (
            <div className="flex gap-2 items-center">
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
                }}
                data-testid="farm-type-filter"
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                {Object.entries(farmTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
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
          } as Partial<MRT_TableOptions<Farm>>}
        />
      )}
    </div>
  );
}