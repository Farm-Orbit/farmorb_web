"use client";

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import FeedingRecordForm from '@/components/feeding/FeedingRecordForm';
import Button from '@/components/ui/button/Button';
import { useFeeding } from '@/hooks/useFeeding';
import { CreateFeedingRecordRequest, FeedingRecord } from '@/types/feeding';

export default function CreateFeedingRecordPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const farmId = params.id as string | undefined;
  const animalId = searchParams.get('animal_id') || undefined;
  const groupId = searchParams.get('group_id') || undefined;
  const { addFeedingRecord, clearError } = useFeeding();

  // Determine redirect URL based on context
  const redirectUrl = useMemo(() => {
    if (animalId) {
      return `/farms/${farmId}/animals/${animalId}?tab=feeding`;
    }
    if (groupId) {
      return `/farms/${farmId}/groups/${groupId}?tab=feeding`;
    }
    return `/farms/${farmId}?tab=feeding`;
  }, [farmId, animalId, groupId]);

  const initialValues = useMemo<Partial<FeedingRecord>>(() => {
    const values: Partial<FeedingRecord> = {};
    if (animalId) {
      values.animal_id = animalId;
    }
    if (groupId) {
      values.group_id = groupId;
    }
    return values;
  }, [animalId, groupId]);

  const handleSubmit = useCallback(
    async (data: CreateFeedingRecordRequest) => {
      if (!farmId) return;
      await addFeedingRecord(farmId, data);
      router.push(redirectUrl);
    },
    [addFeedingRecord, farmId, router, redirectUrl]
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

  // Feeding records must be created from an animal or group context
  if (!animalId && !groupId) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Invalid Request</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Feeding records must be created from an animal or group page. Please navigate to an animal or group and create the record from there.
          </p>
          <Button onClick={() => router.push(`/farms/${farmId}`)}>Back to Farm</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Create Feeding Record</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Record feeding events to track nutrition and feed consumption for your livestock.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <FeedingRecordForm
          mode="create"
          farmId={farmId}
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Save Feeding Record"
          cancelLabel="Cancel"
        />
      </div>
    </div>
  );
}

