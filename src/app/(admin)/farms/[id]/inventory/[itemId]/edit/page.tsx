"use client";

import { useRouter, useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { InventoryItemForm } from '@/components/inventory';
import Button from '@/components/ui/button/Button';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { useInventory } from '@/hooks/useInventory';
import { InventoryItem, UpdateInventoryItemRequest } from '@/types/inventory';
import { useNotificationContext } from '@/providers/NotificationProvider';

export default function EditInventoryItemPage() {
  const router = useRouter();
  const params = useParams();
  const { getInventoryItemById, editInventoryItem, clearError, currentItem } = useInventory();
  const { addNotification } = useNotificationContext();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const farmId = params.id as string;
  const itemId = params.itemId as string;

  useEffect(() => {
    if (farmId && itemId) {
      getInventoryItemById(farmId, itemId)
        .then(() => {
          // Item will be set via currentItem useEffect
        })
        .catch((error) => {
          console.error('Failed to load inventory item', error);
          addNotification({
            type: 'error',
            title: 'Load Failed',
            message: 'Failed to load inventory item. Please try again.',
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [farmId, itemId, getInventoryItemById, addNotification]);

  useEffect(() => {
    if (currentItem) {
      setItem(currentItem);
    }
  }, [currentItem]);

  const handleSubmit = useCallback(
    async (data: UpdateInventoryItemRequest) => {
      try {
        await editInventoryItem(farmId, itemId, data);
        addNotification({
          type: 'success',
          title: 'Item Updated',
          message: 'Inventory item has been updated successfully.',
        });
        router.push(`/farms/${farmId}?tab=inventory`);
      } catch (error: any) {
        addNotification({
          type: 'error',
          title: 'Update Failed',
          message: error || 'Failed to update inventory item. Please try again.',
        });
      }
    },
    [editInventoryItem, farmId, itemId, router, addNotification]
  );

  const handleCancel = useCallback(() => {
    clearError();
    router.back();
  }, [clearError, router]);

  if (!farmId || !itemId) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Invalid Parameters</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            We couldn't find the inventory item you're trying to edit.
          </p>
          <Button onClick={() => router.push('/farms')}>Back to Farms</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading inventory item...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Item Not Found</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The inventory item you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => router.push(`/farms/${farmId}?tab=inventory`)}>
            Back to Inventory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full p-6 space-y-6">
      <div className="mb-4">
        <Breadcrumbs farmId={farmId} />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Inventory Item</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Update the details of this inventory item.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <InventoryItemForm
          mode="edit"
          farmId={farmId}
          initialValues={item}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Save Changes"
          cancelLabel="Cancel"
        />
      </div>
    </div>
  );
}

