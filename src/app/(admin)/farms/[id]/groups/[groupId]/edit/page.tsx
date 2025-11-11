"use client";

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import GroupForm from '@/components/groups/GroupForm';
import Button from '@/components/ui/button/Button';
import { useGroups } from '@/hooks/useGroups';
import { UpdateGroupRequest } from '@/types/group';

export default function EditGroupPage() {
  const router = useRouter();
  const params = useParams();
  const {
    currentGroup,
    isLoading,
    error,
    getGroupById,
    editGroup,
    clearError,
    selectGroup,
  } = useGroups();

  const farmId = params.id as string | undefined;
  const groupId = params.groupId as string | undefined;

  useEffect(() => {
    if (farmId && groupId) {
      getGroupById(farmId, groupId).catch((err) => {
        console.error('Failed to load group', err);
      });
    }

    return () => {
      selectGroup(null);
      clearError();
    };
  }, [farmId, groupId, getGroupById, selectGroup, clearError]);

  const handleSubmit = useCallback(
    async (data: Partial<UpdateGroupRequest>) => {
      if (!farmId || !groupId) {
        throw new Error('Missing farm or group identifier');
      }
      await editGroup(farmId, groupId, data);
      router.push(`/farms/${farmId}?tab=groups`);
    },
    [editGroup, farmId, groupId, router]
  );

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  if (!farmId || !groupId) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Invalid Group</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            We couldn’t find the group you’re trying to manage.
          </p>
          <Button onClick={() => router.push('/farms')}>Back to Farms</Button>
        </div>
      </div>
    );
  }

  if (isLoading && !currentGroup) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading group...</p>
        </div>
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Group Not Found</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The group you are trying to edit does not exist or you do not have access.
          </p>
          <Button onClick={() => router.push(`/farms/${farmId}?tab=groups`)}>Back to Groups</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Group</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Update group information to keep your records accurate.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <GroupForm
          mode="edit"
          initialValues={{
            name: currentGroup.name,
            purpose: currentGroup.purpose ?? '',
            description: currentGroup.description ?? '',
            location: currentGroup.location ?? '',
          }}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Update Group"
          cancelLabel="Cancel"
          submitTestId="update-group-submit-button"
          cancelTestId="cancel-group-button"
        />
        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400" data-testid="group-submit-error">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
