"use client";

import HealthSchedulesTable from '@/components/health/HealthSchedulesTable';

interface GroupHealthSchedulesProps {
  farmId: string;
  groupId: string;
}

export default function GroupHealthSchedules({ farmId, groupId }: GroupHealthSchedulesProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Health Schedules</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Health schedules and reminders for animals in this group.
        </p>
      </div>

      <HealthSchedulesTable farmId={farmId} groupId={groupId} />
    </div>
  );
}

