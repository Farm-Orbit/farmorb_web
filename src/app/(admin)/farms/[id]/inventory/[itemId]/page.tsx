"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInventory } from '@/hooks/useInventory';
import { InventoryItem } from '@/types/inventory';
import InventoryTransactionsTable from '@/components/inventory/InventoryTransactionsTable';
import { formatDate } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/currencyUtils';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';
import InventoryTransactionForm from '@/components/inventory/InventoryTransactionForm';
import { CreateInventoryTransactionRequest, TransactionType } from '@/types/inventory';

const categoryLabels: Record<string, string> = {
  feed: 'Feed',
  medication: 'Medication',
  equipment: 'Equipment',
  supplies: 'Supplies',
  other: 'Other',
};

export default function InventoryItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const farmId = params.id as string;
  const itemId = params.itemId as string;

  const { getInventoryItemById, addInventoryTransaction, getInventoryItems } = useInventory();

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [defaultTransactionType, setDefaultTransactionType] = useState<TransactionType>('restock');

  useEffect(() => {
    const loadItem = async () => {
      if (!farmId || !itemId) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const itemData = await getInventoryItemById(farmId, itemId);
        setItem(itemData);
      } catch (err: any) {
        console.error('Failed to load inventory item:', err);
        setError(err?.error || err?.message || 'Failed to load inventory item');
      } finally {
        setIsLoading(false);
      }
    };

    loadItem();
  }, [farmId, itemId, getInventoryItemById]);

  const handleCreateTransaction = async (data: CreateInventoryTransactionRequest) => {
    if (!item) {
      return;
    }

    try {
      await addInventoryTransaction(farmId, item.id, data);
      setIsTransactionModalOpen(false);
      // Refresh item to get updated quantity
      const updatedItem = await getInventoryItemById(farmId, itemId);
      setItem(updatedItem);
    } catch (error) {
      console.error('Failed to create transaction:', error);
      throw error;
    }
  };

  const handleTopUp = (type: TransactionType = 'restock') => {
    setDefaultTransactionType(type);
    setIsTransactionModalOpen(true);
  };

  const handleCloseTransactionModal = () => {
    setIsTransactionModalOpen(false);
  };

  const isLowStock = useMemo(() => {
    if (!item || !item.low_stock_threshold) {
      return false;
    }
    return item.quantity <= item.low_stock_threshold;
  }, [item]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading inventory item...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-sm text-red-600 dark:text-red-400 mb-4">
          {error || 'Inventory item not found'}
        </p>
        <Button variant="outline" onClick={() => router.push(`/farms/${farmId}?tab=inventory`)}>
          Back to Inventory
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/farms/${farmId}?tab=inventory`)}
            className="mb-4"
          >
            ← Back to Inventory
          </Button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{item.name}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {categoryLabels[item.category] || item.category}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/farms/${farmId}/inventory/${item.id}/edit`)}
            data-testid="edit-item-button"
          >
            Edit Item
          </Button>
          <Button
            onClick={() => handleTopUp('restock')}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
            data-testid="top-up-button"
          >
            Top-up
          </Button>
        </div>
      </div>

      {/* Item Details Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Item Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</p>
            <p
              className={`text-lg font-semibold mt-1 ${
                isLowStock
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {item.quantity} {item.unit}
              {isLowStock && (
                <span className="ml-2 text-xs font-normal text-red-600 dark:text-red-400">
                  (Low Stock)
                </span>
              )}
            </p>
            {item.low_stock_threshold && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Low stock threshold: {item.low_stock_threshold} {item.unit}
              </p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Cost per Unit</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
              {formatCurrency(item.cost_per_unit)}
            </p>
          </div>

          {item.expiry_date && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Expiry Date</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {formatDate(item.expiry_date)}
              </p>
            </div>
          )}

          {item.notes && (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.notes}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Created</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {formatDate(item.created_at)}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {formatDate(item.updated_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction History</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTopUp('usage')}
              data-testid="record-usage-button"
            >
              Record Usage
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTopUp('adjustment')}
              data-testid="record-adjustment-button"
            >
              Record Adjustment
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTopUp('loss')}
              data-testid="record-loss-button"
            >
              Record Loss
            </Button>
          </div>
        </div>
        <InventoryTransactionsTable farmId={farmId} itemId={itemId} />
      </div>

      {/* Transaction Modal */}
      {item && (
        <Modal
          isOpen={isTransactionModalOpen}
          onClose={handleCloseTransactionModal}
          className="max-w-[700px] m-4"
        >
          <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
            <InventoryTransactionForm
              farmId={farmId}
              inventoryItem={item}
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

