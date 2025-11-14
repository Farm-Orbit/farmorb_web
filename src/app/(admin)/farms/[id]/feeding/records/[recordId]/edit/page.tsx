"use client";

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import FeedingRecordForm from '@/components/feeding/FeedingRecordForm';
import Button from '@/components/ui/button/Button';
import { useFeeding } from '@/hooks/useFeeding';
import { FeedingRecord, UpdateFeedingRecordRequest } from '@/types/feeding';

export default function EditFeedingRecordPage() {
  const params = useParams();
  const router = useRouter();
  const farmId = params.id as string | undefined;
  const recordId = params.recordId as string | undefined;
  const { getFeedingRecordById, editFeedingRecord, clearError } = useFeeding();
  const [record, setRecord] = useState<FeedingRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      if (!farmId || !recordId) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await getFeedingRecordById(farmId, recordId);
        setRecord(result);
      } catch (error) {
        console.error('Failed to load feeding record:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecord();
  }, [farmId, recordId, getFeedingRecordById]);

  const handleSubmit = useCallback(
    async (data: UpdateFeedingRecordRequest) => {
      if (!farmId || !recordId) return;
      await editFeedingRecord(farmId, recordId, data);
      router.push(`/farms/${farmId}?tab=feeding`);
    },
    [editFeedingRecord, farmId, recordId, router]
  );

  const handleCancel = useCallback(() => {
    clearError();
    router.back();
  }, [clearError, router]);

  if (!farmId || !recordId) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Feeding record not found</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The feeding record you are trying to edit could not be found.
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
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading feeding record...</p>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Feeding record not found</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The feeding record could not be found or you do not have permission to edit it.
          </p>
          <Button onClick={() => router.push(`/farms/${farmId}?tab=feeding`)}>Back to Feeding</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Feeding Record</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Update the details of this feeding event to keep nutrition tracking accurate.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <FeedingRecordForm
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

