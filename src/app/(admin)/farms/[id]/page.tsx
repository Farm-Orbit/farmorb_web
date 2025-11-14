"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useFarms } from '@/hooks/useFarms';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationContext } from '@/providers/NotificationProvider';
import { Farm } from '@/types/farm';
import { FarmActivity } from '@/components/farms';
import GroupsTable from '@/components/groups/GroupsTable';
import AnimalsTable from '@/components/animals/AnimalsTable';
import MembersTable from '@/components/farms/MembersTable';
import BreedingRecordsTable from '@/components/breeding/BreedingRecordsTable';
import HealthRecordsTable from '@/components/health/HealthRecordsTable';
import HealthSchedulesTable from '@/components/health/HealthSchedulesTable';
import { InventoryItemsTable } from '@/components/inventory';
import SuppliersTable from '@/components/inventory/SuppliersTable';
import FeedingRecordsTable from '@/components/feeding/FeedingRecordsTable';
import Button from '@/components/ui/button/Button';
import SidebarNav, { SidebarNavItem } from '@/components/layout/SidebarNav';
import Breadcrumbs from '@/components/layout/Breadcrumbs';

const farmTypeLabels: Record<string, string> = {
  crop: 'Crop Farm',
  livestock: 'Livestock Farm',
  mixed: 'Mixed Farm',
  dairy: 'Dairy Farm',
  poultry: 'Poultry Farm',
  other: 'Other',
};

const getStatusColor = (isActive: boolean) => {
  return isActive
    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
};

type FarmTab = 'animals' | 'groups' | 'breeding' | 'health' | 'feeding' | 'inventory' | 'suppliers' | 'details' | 'members' | 'activity';

export default function FarmDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getFarmById, currentFarm, isLoading, error, removeFarm } = useFarms();
  const { user } = useAuth();
  const { addNotification } = useNotificationContext();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [activeTab, setActiveTab] = useState<FarmTab>('animals');

  const farmId = params.id as string;

  // Check if current user is the owner of the farm
  // For testing purposes, always show farm members section
  const isOwner = true; // farm?.created_by === user?.id;

  useEffect(() => {
    if (farmId) {
      getFarmById(farmId);
    }
  }, [farmId, getFarmById]);

  // Handle notification from URL parameters
  useEffect(() => {
    const invitation = searchParams.get('invitation');
    const email = searchParams.get('email');
    const tab = searchParams.get('tab');

    if (invitation === 'success' && email) {
      addNotification({
        type: 'success',
        title: 'Invitation Sent!',
        message: `Invitation sent successfully.`
      });

      // Clear the URL parameters after showing notification
      const url = new URL(window.location.href);
      url.searchParams.delete('invitation');
      url.searchParams.delete('email');
      router.replace(url.pathname + url.search);
    }

    if (
      tab === 'animals' ||
      tab === 'details' ||
      tab === 'groups' ||
      tab === 'members' ||
      tab === 'activity' ||
      tab === 'breeding' ||
      tab === 'health' ||
      tab === 'feeding' ||
      tab === 'inventory' ||
      tab === 'suppliers'
    ) {
      setActiveTab(tab as FarmTab);
    }
  }, [searchParams, router, addNotification]);

  useEffect(() => {
    if (currentFarm) {
      setFarm(currentFarm);
    }
  }, [currentFarm]);


  const handleDeleteFarm = async () => {
    if (farm && window.confirm(`Are you sure you want to delete "${farm.name}"?`)) {
      try {
        await removeFarm(farm.id);
        addNotification({
          type: 'success',
          title: 'Farm Deleted',
          message: `"${farm.name}" has been successfully deleted.`
        });
        router.push('/farms');
      } catch (err) {
        console.error('Failed to delete farm:', err);
        addNotification({
          type: 'error',
          title: 'Delete Failed',
          message: 'Failed to delete the farm. Please try again or contact support if the problem persists.'
        });
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatSize = (acres?: number, hectares?: number) => {
    if (acres && hectares) {
      return `${acres.toLocaleString()} acres (${hectares.toLocaleString()} hectares)`;
    } else if (acres) {
      return `${acres.toLocaleString()} acres`;
    } else if (hectares) {
      return `${hectares.toLocaleString()} hectares`;
    }
    return 'N/A';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading farm details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Farm</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={() => router.push('/farms')}>
            Back to Farms
          </Button>
        </div>
      </div>
    );
  }

  if (!farm && !isLoading) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Farm Not Found</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The farm you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => router.push('/farms')}>
            Back to Farms
          </Button>
        </div>
      </div>
    );
  }

  if (!farm && isLoading) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading Farm...</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Please wait while we load the farm details.
          </p>
        </div>
      </div>
    );
  }

  const tabs: SidebarNavItem<FarmTab>[] = [
    { id: 'animals', label: 'Animals', testId: 'tab-animals' },
    { id: 'groups', label: 'Groups', testId: 'tab-groups' },
    { id: 'breeding', label: 'Breeding', testId: 'tab-breeding' },
    { id: 'health', label: 'Health', testId: 'tab-health' },
    { id: 'feeding', label: 'Feeding', testId: 'tab-feeding' },
    { id: 'inventory', label: 'Inventory', testId: 'tab-inventory' },
    { id: 'suppliers', label: 'Suppliers', testId: 'tab-suppliers' },
    { id: 'details', label: 'Details', testId: 'tab-details' },
    { id: 'members', label: 'Members', testId: 'tab-members' },
    { id: 'activity', label: 'Activity', testId: 'tab-activity' },
  ];

  return (
    <div className="w-full p-4 md:p-6" data-testid="farm-detail-page">
      <div className="mb-4">
        <Breadcrumbs farmId={farmId} />
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
        <div className="md:w-32 lg:w-38 flex-shrink-0">
          <SidebarNav
            items={tabs}
            value={activeTab}
            onChange={(nextTab) => setActiveTab(nextTab)}
            selectLabel="Select farm section"
            selectId="farm-tab-select"
            selectTestId="farm-tab-select"
          />
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{farm?.name || 'Loading...'}</h1>
              {farm && (
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(farm.is_active)}`}>
                  {farm.is_active ? 'Active' : 'Inactive'}
                </span>
              )}
            </div>

            {isOwner && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/farms/${farmId}/edit`)}
                  data-testid="edit-farm-button"
                >
                  Edit Farm
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                  onClick={handleDeleteFarm}
                  data-testid="delete-farm-button"
                >
                  Delete Farm
                </Button>
              </div>
            )}
          </div>

          {activeTab === 'animals' && (
            <AnimalsTable farmId={farmId} />
          )}

          {activeTab === 'groups' && (
            <GroupsTable farmId={farmId} />
          )}

          {activeTab === 'breeding' && (
            <BreedingRecordsTable farmId={farmId} />
          )}

          {activeTab === 'health' && (
            <div className="space-y-12">
              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Health Records</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Review and log animal health events, treatments, and inspections.
                  </p>
                </div>
                <HealthRecordsTable farmId={farmId} />
              </section>

              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Health Schedules</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage upcoming health routines and automate reminders for your farm.
                  </p>
                </div>
                <HealthSchedulesTable farmId={farmId} />
              </section>
            </div>
          )}

          {activeTab === 'feeding' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Feeding Records</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Record and track feeding events to monitor nutrition and feed consumption for your livestock.
                  Create feeding records from animal or group pages.
                </p>
              </div>
              <FeedingRecordsTable farmId={farmId} />
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Inventory Items</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Track feed, medication, equipment, and supplies to manage your farm inventory.
                </p>
              </div>
              <InventoryItemsTable farmId={farmId} />
            </div>
          )}

          {activeTab === 'suppliers' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Suppliers</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your suppliers and vendor relationships.
                </p>
              </div>
              <SuppliersTable farmId={farmId} />
            </div>
          )}

          {activeTab === 'details' && farm && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
                  <div className="space-y-4">
                    <div>
                      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Farm Type</span>
                      <span className="text-sm text-gray-900 dark:text-white">{farmTypeLabels[farm.farm_type] || farm.farm_type || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Size</span>
                      <span className="text-sm text-gray-900 dark:text-white">{formatSize(farm.size_acres, farm.size_hectares)}</span>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
                      <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(farm.is_active)}`}>
                        {farm.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {farm.description && (
                      <div>
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</span>
                        <span className="text-sm text-gray-900 dark:text-white">{farm.description}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Information */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Location Information</h2>
                  <div className="space-y-4">
                    <div>
                      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</span>
                      <span className="text-sm text-gray-900 dark:text-white">{farm.location_address || 'N/A'}</span>
                    </div>
                    {(farm.location_latitude && farm.location_longitude) && (
                      <div>
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Coordinates</span>
                        <span className="text-sm text-gray-900 dark:text-white">{farm.location_latitude}, {farm.location_longitude}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Information</h2>
                <div className="space-y-4">
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Created</span>
                    <span className="text-sm text-gray-900 dark:text-white">{formatDate(farm.created_at)}</span>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</span>
                    <span className="text-sm text-gray-900 dark:text-white">{formatDate(farm.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <MembersTable farmId={farmId} />
          )}

          {activeTab === 'activity' && (
            <FarmActivity farmId={farmId} />
          )}
        </div>
      </div>
    </div>
  );
}

