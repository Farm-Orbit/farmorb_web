"use client";

import HealthSchedulesTable from '@/components/health/HealthSchedulesTable';
import Button from '@/components/ui/button/Button';
import { useParams, useRouter } from 'next/navigation';

export default function HealthSchedulesContent() {
  const params = useParams();
  const router = useRouter();
  const farmId = params.id as string | undefined;

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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Health Schedules</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage recurring health routines to keep your animals on track for vaccinations, inspections, and treatments.
        </p>
      </div>

      <HealthSchedulesTable farmId={farmId} />
    </div>
  );
}
