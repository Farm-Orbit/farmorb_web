"use client";

import { Metadata } from 'next';
import { useParams, useRouter } from 'next/navigation';
import { useCallback } from 'react';
import BreedingRecordForm from '@/components/breeding/BreedingRecordForm';
import Button from '@/components/ui/button/Button';
import { useBreeding } from '@/hooks/useBreeding';
import { CreateBreedingRecordRequest } from '@/types/breeding';

export default function CreateBreedingRecordPage() {
  const params = useParams();
  const router = useRouter();
  const farmId = params.id as string | undefined;
  const { addBreedingRecord, clearError } = useBreeding();

  const handleSubmit = useCallback(
    async (data: CreateBreedingRecordRequest) => {
      if (!farmId) return;
      await addBreedingRecord(farmId, data);
      router.push(`/farms/${farmId}?tab=breeding`);
    },
    [addBreedingRecord, farmId, router]
  );

  const handleCancel = useCallback(() => {
    clearError();
    router.back();
  }, [clearError, router]);

  if (!farmId) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Farm not found</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The requested farm could not be found. Please return to the farms list and try again.
          </p>
          <Button onClick={() => router.push('/farms')}>Back to Farms</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Log Breeding Event</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Document breeding details to keep reproductive history up to date for this farm.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <BreedingRecordForm
          mode="create"
          farmId={farmId}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Create Breeding Record"
          cancelLabel="Cancel"
        />
      </div>
    </div>
  );
}
