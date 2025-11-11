"use client";

import HealthRecordsTable from '@/components/health/HealthRecordsTable';
import Button from '@/components/ui/button/Button';
import { useParams, useRouter } from 'next/navigation';

export default function HealthRecordsContent() {
  const params = useParams();
  const router = useRouter();
  const farmId = params.id as string | undefined;

  if (!farmId) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Farm not found</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The requested farm could not be located. Please return to the farms list and try again.
          </p>
          <Button onClick={() => router.push('/farms')}>Back to Farms</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Health Records</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Track treatments, vaccinations, inspections, and health outcomes across your livestock and groups.
        </p>
      </div>

      <HealthRecordsTable farmId={farmId} />
    </div>
  );
}
