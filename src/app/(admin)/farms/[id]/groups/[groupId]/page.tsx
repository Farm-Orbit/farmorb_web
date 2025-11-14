"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useGroups } from '@/hooks/useGroups';
import { Group } from '@/types/group';
import SidebarNav, { SidebarNavItem } from '@/components/layout/SidebarNav';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import GroupOverview from '@/components/groups/GroupOverview';
import GroupAnimalsTable from '@/components/groups/GroupAnimalsTable';
import GroupHealthSchedules from '@/components/groups/GroupHealthSchedules';
import GroupFeedingRecords from '@/components/groups/GroupFeedingRecords';
import GroupBreedingSnapshot from '@/components/groups/GroupBreedingSnapshot';
import Button from '@/components/ui/button/Button';

type GroupTab = 'overview' | 'animals' | 'health' | 'feeding' | 'breeding';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getGroupById, currentGroup, isLoading, selectGroup } = useGroups();
  const [group, setGroup] = useState<Group | null>(null);
  const [activeTab, setActiveTab] = useState<GroupTab>('overview');

  const farmId = params.id as string;
  const groupId = params.groupId as string;

  useEffect(() => {
    if (farmId && groupId) {
      getGroupById(farmId, groupId)
        .then(() => {
          // Group will be set via currentGroup useEffect
        })
        .catch((error) => {
          console.error('Failed to load group', error);
        });
    }

    return () => {
      selectGroup(null);
    };
  }, [farmId, groupId, getGroupById, selectGroup]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'overview' || tab === 'animals' || tab === 'health' || tab === 'feeding' || tab === 'breeding') {
      setActiveTab(tab as GroupTab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (currentGroup) {
      setGroup(currentGroup);
    }
  }, [currentGroup]);

  const tabs: SidebarNavItem<GroupTab>[] = [
    { id: 'overview', label: 'Overview', testId: 'tab-overview' },
    { id: 'animals', label: 'Animals', testId: 'tab-animals' },
    { id: 'health', label: 'Health', testId: 'tab-health' },
    { id: 'feeding', label: 'Feeding', testId: 'tab-feeding' },
    { id: 'breeding', label: 'Breeding', testId: 'tab-breeding' },
  ];

  const handleTabChange = (tab: GroupTab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    router.replace(url.pathname + url.search, { scroll: false });
  };

  if (!farmId || !groupId) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Invalid Group</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            We couldn't find the group you're looking for.
          </p>
          <Button onClick={() => router.push(`/farms/${farmId}`)}>Back to Farm</Button>
        </div>
      </div>
    );
  }

  if (isLoading && !group) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading group...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Group Not Found</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The group you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.push(`/farms/${farmId}`)}>Back to Farm</Button>
        </div>
      </div>
    );
  }

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

  return (
    <div className="w-full p-4 md:p-6" data-testid="group-detail-page">
      <div className="mb-4">
        <Breadcrumbs farmId={farmId} groupId={groupId} />
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
        <div className="md:w-32 lg:w-38 flex-shrink-0">
          <SidebarNav
            items={tabs}
            value={activeTab}
            onChange={handleTabChange}
            selectLabel="Select group section"
            selectTestId="group-tab-select"
          />
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{group.name}</h1>
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
                onClick={() => router.push(`/farms/${farmId}/groups/${groupId}/edit`)}
              >
                Edit Group
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/farms/${farmId}?tab=groups`)}
              >
                Back to Groups
              </Button>
            </div>
          </div>

          {activeTab === 'overview' && <GroupOverview farmId={farmId} group={group} />}
          {activeTab === 'animals' && <GroupAnimalsTable farmId={farmId} groupId={groupId} />}
          {activeTab === 'health' && <GroupHealthSchedules farmId={farmId} groupId={groupId} />}
          {activeTab === 'feeding' && <GroupFeedingRecords farmId={farmId} groupId={groupId} />}
          {activeTab === 'breeding' && <GroupBreedingSnapshot farmId={farmId} groupId={groupId} />}
        </div>
      </div>
    </div>
  );
}

