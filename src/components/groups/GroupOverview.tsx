"use client";

import Button from '@/components/ui/button/Button';
import { Group } from '@/types/group';
import { useRouter } from 'next/navigation';

interface GroupOverviewProps {
  farmId: string;
  group: Group;
}

const formatDate = (value?: string | null) => {
  if (!value) {
    return 'N/A';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'inactive':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    case 'archived':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

export default function GroupOverview({ farmId, group }: GroupOverviewProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Group Details</h2>
          {group.status && (
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(group.status)}`}>
              {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/farms/${farmId}/groups/${group.id}/edit`)}
          >
            Edit Group
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</span>
              <span className="text-sm text-gray-900 dark:text-white">{group.name}</span>
            </div>
            {group.species && (
              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Species</span>
                <span className="text-sm text-gray-900 dark:text-white capitalize">{group.species}</span>
              </div>
            )}
            {group.purpose && (
              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Purpose</span>
                <span className="text-sm text-gray-900 dark:text-white capitalize">{group.purpose}</span>
              </div>
            )}
            {group.location && (
              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</span>
                <span className="text-sm text-gray-900 dark:text-white">{group.location}</span>
              </div>
            )}
            {group.capacity && (
              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Capacity</span>
                <span className="text-sm text-gray-900 dark:text-white">{group.capacity} animals</span>
              </div>
            )}
            <div>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Created</span>
              <span className="text-sm text-gray-900 dark:text-white">{formatDate(group.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Information</h3>
          <div className="space-y-4">
            {group.description && (
              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</span>
                <span className="text-sm text-gray-900 dark:text-white">{group.description}</span>
              </div>
            )}
            {group.notes && (
              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</span>
                <span className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{group.notes}</span>
              </div>
            )}
            <div>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</span>
              <span className="text-sm text-gray-900 dark:text-white">{formatDate(group.updated_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

