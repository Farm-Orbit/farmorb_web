"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/button/Button';
import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import { useInventory } from '@/hooks/useInventory';
import { InventoryItem, InventoryCategory, CreateInventoryTransactionRequest, TransactionType } from '@/types/inventory';
import { buildListOptions } from '@/utils/listOptions';
import { Modal } from '@/components/ui/modal';
import InventoryTransactionForm from './InventoryTransactionForm';
import {
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_PaginationState,
  type MRT_SortingState,
  type MRT_TableOptions,
} from 'material-react-table';
import { useRouter } from 'next/navigation';
import { ListOptions } from '@/types/list';
import { formatCurrency } from '@/utils/currencyUtils';

interface InventoryItemsTableProps {
  farmId: string;
}

const categoryLabels: Record<InventoryCategory, string> = {
  feed: 'Feed',
  medication: 'Medication',
  equipment: 'Equipment',
  supplies: 'Supplies',
  other: 'Other',
};

const sortColumnMap: Record<string, string> = {
  name: 'name',
  category: 'category',
  quantity: 'quantity',
  created_at: 'created_at',
};

const filterColumnMap: Record<string, string> = {
  name: 'name',
  category: 'category',
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

export default function InventoryItemsTable({ farmId }: InventoryItemsTableProps) {
  const router = useRouter();
  const {
    inventoryItems: storeItems,
    getInventoryItems,
    removeInventoryItem,
    addInventoryTransaction,
    isLoadingItems,
    error,
    clearError,
  } = useInventory();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | InventoryCategory>('all');
  const [paginationState, setPaginationState] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sortingState, setSortingState] = useState<MRT_SortingState>([]);
  const [columnFiltersState, setColumnFiltersState] = useState<MRT_ColumnFiltersState>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [defaultTransactionType, setDefaultTransactionType] = useState<TransactionType>('restock');

  useEffect(() => {
    if (!isLoadingItems && storeItems.length && items.length === 0) {
      setItems(storeItems);
    }
  }, [storeItems, isLoadingItems, items.length]);

  const fetchItems = useCallback(async () => {
    if (!farmId) {
      setItems([]);
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
        extraFilters: {
          category: categoryFilter === 'all' ? undefined : categoryFilter,
        },
      });

      const result = await getInventoryItems(farmId, params);

      if (result.items.length === 0 && result.total > 0 && paginationState.pageIndex > 0) {
        setPaginationState((prev) => ({ ...prev, pageIndex: Math.max(prev.pageIndex - 1, 0) }));
        return;
      }

      setItems(result.items);
      setTotal(result.total);
    } catch (err: any) {
      console.error('Failed to load inventory items:', err);
    } finally {
      setIsLoading(false);
    }
  }, [farmId, paginationState, sortingState, columnFiltersState, categoryFilter, getInventoryItems, clearError]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleNavigateToCreate = useCallback(() => {
    router.push(`/farms/${farmId}/inventory/new`);
  }, [router, farmId]);

  const handleNavigateToDetail = useCallback(
    (item: InventoryItem) => {
      router.push(`/farms/${farmId}/inventory/${item.id}`);
    },
    [router, farmId]
  );

  const handleNavigateToEdit = useCallback(
    (item: InventoryItem) => {
      router.push(`/farms/${farmId}/inventory/${item.id}/edit`);
    },
    [router, farmId]
  );

  const handleDeleteItem = useCallback(
    async (item: InventoryItem) => {
      if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
        return;
      }

      setIsProcessing(true);
      try {
        await removeInventoryItem(farmId, item.id);
        await fetchItems();
      } catch (error) {
        console.error('Failed to delete inventory item:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [farmId, fetchItems, removeInventoryItem]
  );

  const handleTopUp = useCallback((item: InventoryItem, type: TransactionType = 'restock') => {
    setSelectedItem(item);
    setDefaultTransactionType(type);
    setIsTransactionModalOpen(true);
  }, []);

  const handleCreateTransaction = useCallback(
    async (data: CreateInventoryTransactionRequest) => {
      if (!selectedItem) {
        return;
      }

      try {
        await addInventoryTransaction(farmId, selectedItem.id, data);
        setIsTransactionModalOpen(false);
        setSelectedItem(null);
        await fetchItems(); // Refresh items to show updated quantities
      } catch (error) {
        console.error('Failed to create transaction:', error);
        throw error; // Re-throw to let the form handle the error
      }
    },
    [farmId, selectedItem, addInventoryTransaction, fetchItems]
  );

  const handleCloseTransactionModal = useCallback(() => {
    setIsTransactionModalOpen(false);
    setSelectedItem(null);
  }, []);

  const columns = useMemo<MRT_ColumnDef<InventoryItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        size: 200,
        enableColumnFilter: false,
        Cell: ({ cell, row }) => (
          <button
            onClick={() => handleNavigateToDetail(row.original)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
            data-testid={`item-name-link-${row.original.id}`}
          >
            {cell.getValue<string>()}
          </button>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-900 dark:text-white">
            {categoryLabels[cell.getValue<InventoryCategory>()] || cell.getValue<string>()}
          </span>
        ),
        filterVariant: 'select',
        filterSelectOptions: Object.entries(categoryLabels).map(([value, label]) => ({ value, label })),
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        size: 120,
        enableColumnFilter: false,
        Cell: ({ row }) => {
          const quantity = row.original.quantity;
          const unit = row.original.unit;
          const lowThreshold = row.original.low_stock_threshold;
          const isLowStock = lowThreshold !== null && lowThreshold !== undefined && quantity <= lowThreshold;

          return (
            <div className="flex flex-col">
              <span className={`text-sm font-medium ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                {quantity} {unit}
              </span>
              {isLowStock && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 mt-1"
                  data-testid={`low-stock-badge-${row.original.id}`}
                >
                  Low Stock
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'cost_per_unit',
        header: 'Cost/Unit',
        size: 120,
        enableColumnFilter: false,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatCurrency(cell.getValue<number | null>())}
          </span>
        ),
      },
      {
        accessorKey: 'expiry_date',
        header: 'Expiry Date',
        size: 140,
        enableColumnFilter: false,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(cell.getValue<string | null>())}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 200,
        enableColumnFilter: false,
        enableSorting: false,
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 border-green-300 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
              onClick={(event) => {
                event.stopPropagation();
                handleTopUp(row.original, 'restock');
              }}
              data-testid={`top-up-button-${row.original.id}`}
            >
              Top-up
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                handleNavigateToEdit(row.original);
              }}
              data-testid={`edit-item-button-${row.original.id}`}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
              onClick={(event) => {
                event.stopPropagation();
                handleDeleteItem(row.original);
              }}
              disabled={isProcessing}
              data-testid={`delete-item-button-${row.original.id}`}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [handleDeleteItem, handleNavigateToEdit, handleNavigateToDetail, handleTopUp, isProcessing]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select
          value={categoryFilter}
          onChange={(event) => {
            setCategoryFilter(event.target.value as typeof categoryFilter);
            setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          data-testid="inventory-category-filter"
        >
          <option value="all">All Categories</option>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <Button onClick={handleNavigateToCreate} data-testid="inventory-create-button">
          Create Item
        </Button>
      </div>

      {!isLoading && items.length === 0 ? (
        <div
          className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          data-testid="inventory-items-empty"
        >
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No inventory items yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Track feed, medication, equipment, and supplies to manage your farm inventory.
          </p>
        </div>
      ) : (
        <div data-testid="inventory-items-table">
          <CustomMaterialTable
            columns={columns}
            data={items}
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
            } as Partial<MRT_TableOptions<InventoryItem>>}
          />
        </div>
      )}

      {selectedItem && (
        <Modal
          isOpen={isTransactionModalOpen}
          onClose={handleCloseTransactionModal}
          className="max-w-[700px] m-4"
        >
          <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
            <InventoryTransactionForm
              farmId={farmId}
              inventoryItem={selectedItem}
              onSubmit={handleCreateTransaction}
              onCancel={handleCloseTransactionModal}
              defaultTransactionType={defaultTransactionType}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

