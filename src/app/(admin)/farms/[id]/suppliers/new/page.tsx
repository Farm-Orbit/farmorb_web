"use client";

import { useRouter, useParams } from 'next/navigation';
import { useCallback } from 'react';
import { SupplierForm } from '@/components/inventory';
import Button from '@/components/ui/button/Button';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { useInventory } from '@/hooks/useInventory';
import { CreateSupplierRequest } from '@/types/inventory';
import { useNotificationContext } from '@/providers/NotificationProvider';

export default function CreateSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const { addSupplier, clearError } = useInventory();
  const { addNotification } = useNotificationContext();
  const farmId = params.id as string;

  const handleSubmit = useCallback(
    async (data: CreateSupplierRequest) => {
      try {
        await addSupplier(farmId, data);
        addNotification({
          type: 'success',
          title: 'Supplier Created',
          message: 'Supplier has been created successfully.',
        });
        router.push(`/farms/${farmId}?tab=suppliers`);
      } catch (error: any) {
        addNotification({
          type: 'error',
          title: 'Creation Failed',
          message: error || 'Failed to create supplier. Please try again.',
        });
      }
    },
    [addSupplier, farmId, router, addNotification]
  );

  const handleCancel = useCallback(() => {
    clearError();
    router.back();
  }, [clearError, router]);

  if (!farmId) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Invalid Farm</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            We couldn't find the farm you're trying to manage.
          </p>
          <Button onClick={() => router.push('/farms')}>Back to Farms</Button>
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
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Create Supplier</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Add a new supplier to track your inventory sources.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <SupplierForm
          mode="create"
          farmId={farmId}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Create Supplier"
          cancelLabel="Cancel"
        />
      </div>
    </div>
  );
}

