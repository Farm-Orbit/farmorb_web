"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import { useInventory } from '@/hooks/useInventory';
import { InventoryTransaction, TransactionType } from '@/types/inventory';
import { buildListOptions } from '@/utils/listOptions';
import {
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_PaginationState,
  type MRT_SortingState,
  type MRT_TableOptions,
} from 'material-react-table';
import { ListOptions } from '@/types/list';
import { formatDate } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/currencyUtils';

interface InventoryTransactionsTableProps {
  farmId: string;
  itemId: string;
}

const transactionTypeLabels: Record<TransactionType, string> = {
  purchase: 'Purchase',
  restock: 'Restock',
  usage: 'Usage',
  adjustment: 'Adjustment',
  loss: 'Loss',
};

const transactionTypeColors: Record<TransactionType, string> = {
  purchase: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  restock: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  usage: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  adjustment: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  loss: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

const sortColumnMap: Record<string, string> = {
  transaction_type: 'transaction_type',
  quantity: 'quantity',
  created_at: 'created_at',
};

const filterColumnMap: Record<string, string> = {
  transaction_type: 'transaction_type',
};

export default function InventoryTransactionsTable({
  farmId,
  itemId,
}: InventoryTransactionsTableProps) {
  const {
    transactions: storeTransactions,
    getInventoryTransactions,
    isLoadingTransactions,
    error,
    clearError,
  } = useInventory();

  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [paginationState, setPaginationState] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sortingState, setSortingState] = useState<MRT_SortingState>([]);
  const [columnFiltersState, setColumnFiltersState] = useState<MRT_ColumnFiltersState>([]);

  useEffect(() => {
    if (!isLoadingTransactions && storeTransactions.length && transactions.length === 0) {
      setTransactions(storeTransactions);
    }
  }, [storeTransactions, isLoadingTransactions, transactions.length]);

  const fetchTransactions = useCallback(async () => {
    if (!farmId || !itemId) {
      setTransactions([]);
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

      const result = await getInventoryTransactions(farmId, itemId, params);

      if (result.items.length === 0 && result.total > 0 && paginationState.pageIndex > 0) {
        setPaginationState((prev) => ({ ...prev, pageIndex: Math.max(prev.pageIndex - 1, 0) }));
        return;
      }

      setTransactions(result.items);
      setTotal(result.total);
    } catch (err: any) {
      console.error('Failed to load transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [farmId, itemId, paginationState, sortingState, columnFiltersState, getInventoryTransactions, clearError]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const columns = useMemo<MRT_ColumnDef<InventoryTransaction>[]>(
    () => [
      {
        accessorKey: 'transaction_type',
        header: 'Type',
        size: 120,
        enableColumnFilter: true,
        filterVariant: 'select',
        filterSelectOptions: Object.entries(transactionTypeLabels).map(([value, label]) => ({
          value,
          label,
        })),
        Cell: ({ cell }) => {
          const type = cell.getValue<TransactionType>();
          return (
            <span
              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${transactionTypeColors[type]}`}
            >
              {transactionTypeLabels[type]}
            </span>
          );
        },
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        size: 120,
        enableColumnFilter: false,
        Cell: ({ cell, row }) => {
          const quantity = cell.getValue<number>();
          const type = row.original.transaction_type;
          const isPositive = type === 'purchase' || type === 'restock' || type === 'adjustment';
          return (
            <span
              className={`text-sm font-medium ${
                isPositive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {isPositive ? '+' : '-'}
              {Math.abs(quantity)}
            </span>
          );
        },
      },
      {
        accessorKey: 'cost',
        header: 'Cost',
        size: 100,
        enableColumnFilter: false,
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
        enableColumnFilter: false,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {cell.getValue<string | null>() || 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Date',
        size: 140,
        enableColumnFilter: false,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(cell.getValue<string>())}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      {!isLoading && transactions.length === 0 ? (
        <div
          className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          data-testid="transactions-empty"
        >
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No transactions yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Transaction history will appear here when you record purchases, usage, restocks, adjustments, or losses.
          </p>
        </div>
      ) : (
        <div data-testid="transactions-table">
          <CustomMaterialTable
            columns={columns}
            data={transactions}
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
            } as Partial<MRT_TableOptions<InventoryTransaction>>}
          />
        </div>
      )}
    </div>
  );
}

