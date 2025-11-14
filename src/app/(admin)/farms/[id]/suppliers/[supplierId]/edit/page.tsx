"use client";

import { useRouter, useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { SupplierForm } from '@/components/inventory';
import Button from '@/components/ui/button/Button';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { useInventory } from '@/hooks/useInventory';
import { Supplier, UpdateSupplierRequest } from '@/types/inventory';
import { useNotificationContext } from '@/providers/NotificationProvider';

export default function EditSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const { getSupplierById, editSupplier, clearError, currentSupplier } = useInventory();
  const { addNotification } = useNotificationContext();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const farmId = params.id as string;
  const supplierId = params.supplierId as string;

  useEffect(() => {
    if (farmId && supplierId) {
      getSupplierById(farmId, supplierId)
        .then(() => {
          // Supplier will be set via currentSupplier useEffect
        })
        .catch((error) => {
          console.error('Failed to load supplier', error);
          addNotification({
            type: 'error',
            title: 'Load Failed',
            message: 'Failed to load supplier. Please try again.',
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [farmId, supplierId, getSupplierById, addNotification]);

  useEffect(() => {
    if (currentSupplier) {
      setSupplier(currentSupplier);
    }
  }, [currentSupplier]);

  const handleSubmit = useCallback(
    async (data: UpdateSupplierRequest) => {
      try {
        await editSupplier(farmId, supplierId, data);
        addNotification({
          type: 'success',
          title: 'Supplier Updated',
          message: 'Supplier has been updated successfully.',
        });
        router.push(`/farms/${farmId}?tab=suppliers`);
      } catch (error: any) {
        addNotification({
          type: 'error',
          title: 'Update Failed',
          message: error || 'Failed to update supplier. Please try again.',
        });
      }
    },
    [editSupplier, farmId, supplierId, router, addNotification]
  );

  const handleCancel = useCallback(() => {
    clearError();
    router.back();
  }, [clearError, router]);

  if (!farmId || !supplierId) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Invalid Parameters</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            We couldn't find the supplier you're trying to edit.
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
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading supplier...</p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Supplier Not Found</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The supplier you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => router.push(`/farms/${farmId}?tab=suppliers`)}>
            Back to Suppliers
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
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Supplier</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Update the details of this supplier.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <SupplierForm
          mode="edit"
          farmId={farmId}
          initialValues={supplier}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Save Changes"
          cancelLabel="Cancel"
        />
      </div>
    </div>
  );
}

