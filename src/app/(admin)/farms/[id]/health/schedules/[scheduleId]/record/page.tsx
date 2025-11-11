"use client";

import { Metadata } from 'next';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import HealthRecordForm from '@/components/health/HealthRecordForm';
import Button from '@/components/ui/button/Button';
import { useHealth } from '@/hooks/useHealth';
import { CreateHealthRecordRequest, HealthRecord, HealthSchedule } from '@/types/health';

export default function RecordHealthScheduleCompletionPage() {
  const params = useParams();
  const router = useRouter();
  const farmId = params.id as string | undefined;
  const scheduleId = params.scheduleId as string | undefined;
  const { getHealthScheduleById, logHealthScheduleCompletion, clearError } = useHealth();

  const [schedule, setSchedule] = useState<HealthSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!farmId || !scheduleId) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await getHealthScheduleById(farmId, scheduleId);
        setSchedule(result);
      } catch (error) {
        console.error('Failed to load health schedule:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [farmId, scheduleId, getHealthScheduleById]);

  const handleSubmit = useCallback(
    async (data: CreateHealthRecordRequest) => {
      if (!farmId || !scheduleId) return;
      await logHealthScheduleCompletion(farmId, scheduleId, data);
      router.push(`/farms/${farmId}?tab=health`);
    },
    [farmId, scheduleId, logHealthScheduleCompletion, router]
  );

  const handleCancel = useCallback(() => {
    clearError();
    router.back();
  }, [clearError, router]);

  const initialRecordValues: Partial<HealthRecord> | undefined = useMemo(() => {
    if (!schedule) {
      return undefined;
    }

    return {
      animal_id: schedule.target_type === 'animal' ? schedule.target_id : undefined,
      group_id: schedule.target_type === 'group' ? schedule.target_id : undefined,
      record_type: 'treatment',
      title: `${schedule.name} Completion`,
      performed_at: schedule.start_date,
      description: schedule.description ?? undefined,
    } as Partial<HealthRecord>;
  }, [schedule]);

  if (!farmId || !scheduleId) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Health schedule not found</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The health schedule you are trying to complete could not be found.
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading schedule details...</p>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Health schedule not found</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The health schedule could not be found or you do not have permission to log its completion.
          </p>
          <Button onClick={() => router.push(`/farms/${farmId}?tab=health`)}>Back to Health</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Log Health Schedule Completion</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Record the outcome of <span className="font-medium">{schedule.name}</span> to keep health compliance up to date.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <HealthRecordForm
          mode="create"
          farmId={farmId}
          initialValues={initialRecordValues}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Log Completion"
          cancelLabel="Cancel"
        />
      </div>
    </div>
  );
}
