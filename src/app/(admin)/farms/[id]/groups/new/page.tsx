"use client";

import { useParams, useRouter } from 'next/navigation';
import { useCallback } from 'react';
import GroupForm from '@/components/groups/GroupForm';
import Button from '@/components/ui/button/Button';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { useGroups } from '@/hooks/useGroups';
import { CreateGroupRequest } from '@/types/group';

export default function CreateGroupPage() {
  const router = useRouter();
  const params = useParams();
  const { addGroup } = useGroups();

  const farmId = params.id as string | undefined;

  const handleSubmit = useCallback(
    async (data: Partial<CreateGroupRequest>) => {
      if (!farmId) {
        throw new Error('Missing farm identifier');
      }
      await addGroup(farmId, data as CreateGroupRequest);
      router.push(`/farms/${farmId}?tab=groups`);
    },
    [addGroup, farmId, router]
  );

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  if (!farmId) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Invalid Farm</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            We couldn’t find the farm you’re trying to manage.
          </p>
          <Button onClick={() => router.push('/farms')}>Back to Farms</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full p-6 space-y-6">
      <div className="mb-4">
        <Breadcrumbs farmId={farmId} />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Create Group</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Organize your animals into structured groups for easier management.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <GroupForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Create Group"
          cancelLabel="Cancel"
          submitTestId="create-group-submit-button"
          cancelTestId="cancel-group-button"
        />
      </div>
    </div>
  );
}
