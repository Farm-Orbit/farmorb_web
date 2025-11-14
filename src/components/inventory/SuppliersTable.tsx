"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/button/Button';
import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import { useInventory } from '@/hooks/useInventory';
import { Supplier } from '@/types/inventory';
import { buildListOptions } from '@/utils/listOptions';
import {
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_PaginationState,
  type MRT_SortingState,
  type MRT_TableOptions,
} from 'material-react-table';
import { useRouter } from 'next/navigation';
import { ListOptions } from '@/types/list';

interface SuppliersTableProps {
  farmId: string;
}

const sortColumnMap: Record<string, string> = {
  name: 'name',
  created_at: 'created_at',
};

const filterColumnMap: Record<string, string> = {
  name: 'name',
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

const formatContactInfo = (contactInfo?: Record<string, any> | null) => {
  if (!contactInfo) {
    return 'N/A';
  }
  const parts: string[] = [];
  if (contactInfo.phone) parts.push(`Phone: ${contactInfo.phone}`);
  if (contactInfo.email) parts.push(`Email: ${contactInfo.email}`);
  return parts.length > 0 ? parts.join(', ') : 'N/A';
};

export default function SuppliersTable({ farmId }: SuppliersTableProps) {
  const router = useRouter();
  const {
    suppliers: storeSuppliers,
    getSuppliers,
    removeSupplier,
    isLoadingSuppliers,
    error,
    clearError,
  } = useInventory();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paginationState, setPaginationState] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sortingState, setSortingState] = useState<MRT_SortingState>([]);
  const [columnFiltersState, setColumnFiltersState] = useState<MRT_ColumnFiltersState>([]);

  useEffect(() => {
    if (!isLoadingSuppliers && storeSuppliers.length && suppliers.length === 0) {
      setSuppliers(storeSuppliers);
    }
  }, [storeSuppliers, isLoadingSuppliers, suppliers.length]);

  const fetchSuppliers = useCallback(async () => {
    if (!farmId) {
      setSuppliers([]);
      setTotal(0);
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const params = buildListOptions({
        paginationState,
        sortingState,
        columnFiltersState,
        sortColumnMap,
        filterColumnMap,
      });

      const result = await getSuppliers(farmId, params);

      if (result.items.length === 0 && result.total > 0 && paginationState.pageIndex > 0) {
        setPaginationState((prev) => ({ ...prev, pageIndex: Math.max(prev.pageIndex - 1, 0) }));
        return;
      }

      setSuppliers(result.items);
      setTotal(result.total);
    } catch (err: any) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [farmId, paginationState, sortingState, columnFiltersState, getSuppliers, clearError]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleNavigateToCreate = useCallback(() => {
    router.push(`/farms/${farmId}/suppliers/new`);
  }, [router, farmId]);

  const handleNavigateToEdit = useCallback(
    (supplier: Supplier) => {
      router.push(`/farms/${farmId}/suppliers/${supplier.id}/edit`);
    },
    [router, farmId]
  );

  const handleDeleteSupplier = useCallback(
    async (supplier: Supplier) => {
      if (!confirm(`Are you sure you want to delete "${supplier.name}"?`)) {
        return;
      }

      setIsProcessing(true);
      try {
        await removeSupplier(farmId, supplier.id);
        await fetchSuppliers();
      } catch (error) {
        console.error('Failed to delete supplier:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [farmId, fetchSuppliers, removeSupplier]
  );

  const columns = useMemo<MRT_ColumnDef<Supplier>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        size: 200,
        enableColumnFilter: false,
        Cell: ({ cell }) => (
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {cell.getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'contact_info',
        header: 'Contact Info',
        size: 250,
        enableColumnFilter: false,
        Cell: ({ row }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatContactInfo(row.original.contact_info)}
          </span>
        ),
      },
      {
        accessorKey: 'address',
        header: 'Address',
        size: 250,
        enableColumnFilter: false,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {cell.getValue<string | null>() || 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        size: 140,
        enableColumnFilter: false,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(cell.getValue<string>())}
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
                handleDeleteSupplier(row.original);
              }}
              disabled={isProcessing}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [handleDeleteSupplier, handleNavigateToEdit, isProcessing]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button onClick={handleNavigateToCreate} data-testid="supplier-create-button">
          Create Supplier
        </Button>
      </div>

      {!isLoading && suppliers.length === 0 ? (
        <div
          className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          data-testid="suppliers-empty"
        >
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No suppliers yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Add suppliers to track your inventory sources and manage vendor relationships.
          </p>
        </div>
      ) : (
        <div data-testid="suppliers-table">
          <CustomMaterialTable
            columns={columns}
            data={suppliers}
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
            } as Partial<MRT_TableOptions<Supplier>>}
          />
        </div>
      )}
    </div>
  );
}

