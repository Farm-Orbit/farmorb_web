"use client";

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import BreedingRecordForm from '@/components/breeding/BreedingRecordForm';
import Button from '@/components/ui/button/Button';
import { useBreeding } from '@/hooks/useBreeding';
import { BreedingRecord, UpdateBreedingRecordRequest } from '@/types/breeding';

export default function EditBreedingRecordPage() {
  const params = useParams();
  const router = useRouter();
  const farmId = params.id as string | undefined;
  const recordId = params.recordId as string | undefined;
  const { getBreedingRecordById, editBreedingRecord, clearError } = useBreeding();
  const [record, setRecord] = useState<BreedingRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      if (!farmId || !recordId) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await getBreedingRecordById(farmId, recordId);
        setRecord(result);
      } catch (error) {
        console.error('Failed to load breeding record:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecord();
  }, [farmId, recordId, getBreedingRecordById]);

  const handleSubmit = useCallback(
    async (data: UpdateBreedingRecordRequest) => {
      if (!farmId || !recordId) return;
      await editBreedingRecord(farmId, recordId, data);
      router.push(`/farms/${farmId}?tab=breeding`);
    },
    [editBreedingRecord, farmId, recordId, router]
  );

  const handleCancel = useCallback(() => {
    clearError();
    router.back();
  }, [clearError, router]);

  if (!farmId || !recordId) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Breeding record not found</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The breeding record you are trying to edit could not be found.
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
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading breeding record...</p>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Breeding record not found</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The breeding record could not be found or you do not have permission to edit it.
          </p>
          <Button onClick={() => router.push(`/farms/${farmId}?tab=breeding`)}>Back to Breeding</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Breeding Record</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Update breeding information to keep reproductive history accurate.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <BreedingRecordForm
          mode="edit"
          farmId={farmId}
          initialValues={record}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Save Changes"
          cancelLabel="Cancel"
        />
      </div>
    </div>
  );
}
