"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAnimals } from '@/hooks/useAnimals';
import { Animal } from '@/types/animal';
import SidebarNav, { SidebarNavItem } from '@/components/layout/SidebarNav';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import AnimalOverview from '@/components/animals/AnimalOverview';
import AnimalHealthRecords from '@/components/animals/AnimalHealthRecords';
import AnimalBreedingTimeline from '@/components/animals/AnimalBreedingTimeline';
import AnimalMovementsTable from '@/components/animals/AnimalMovementsTable';
import AnimalGroupsTable from '@/components/animals/AnimalGroupsTable';
import Button from '@/components/ui/button/Button';

type AnimalTab = 'overview' | 'health' | 'breeding' | 'movements' | 'groups';

export default function AnimalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getAnimalById, currentAnimal, isLoading, selectAnimal } = useAnimals();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [activeTab, setActiveTab] = useState<AnimalTab>('overview');

  const farmId = params.id as string;
  const animalId = params.animalId as string;

  useEffect(() => {
    if (farmId && animalId) {
      getAnimalById(farmId, animalId)
        .then(() => {
          // Animal will be set via currentAnimal useEffect
        })
        .catch((error) => {
          console.error('Failed to load animal', error);
        });
    }

    return () => {
      selectAnimal(null);
    };
  }, [farmId, animalId, getAnimalById, selectAnimal]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (
      tab === 'overview' ||
      tab === 'health' ||
      tab === 'breeding' ||
      tab === 'movements' ||
      tab === 'groups'
    ) {
      setActiveTab(tab as AnimalTab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (currentAnimal) {
      setAnimal(currentAnimal);
    }
  }, [currentAnimal]);

  const tabs: SidebarNavItem<AnimalTab>[] = [
    { id: 'overview', label: 'Overview', testId: 'tab-overview' },
    { id: 'health', label: 'Health', testId: 'tab-health' },
    { id: 'breeding', label: 'Breeding', testId: 'tab-breeding' },
    { id: 'movements', label: 'Movements', testId: 'tab-movements' },
    { id: 'groups', label: 'Groups', testId: 'tab-groups' },
  ];

  const handleTabChange = (tab: AnimalTab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    router.replace(url.pathname + url.search, { scroll: false });
  };

  if (!farmId || !animalId) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Invalid Animal</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            We couldn't find the animal you're looking for.
          </p>
          <Button onClick={() => router.push(`/farms/${farmId}`)}>Back to Farm</Button>
        </div>
      </div>
    );
  }

  if (isLoading && !animal) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading animal...</p>
        </div>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Animal Not Found</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The animal you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.push(`/farms/${farmId}`)}>Back to Farm</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6" data-testid="animal-detail-page">
      <div className="mb-4">
        <Breadcrumbs farmId={farmId} animalId={animalId} />
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
        <div className="md:w-32 lg:w-38 flex-shrink-0">
          <SidebarNav
            items={tabs}
            value={activeTab}
            onChange={handleTabChange}
            selectLabel="Select animal section"
            selectTestId="animal-tab-select"
          />
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {animal.name || animal.tag_id || 'Animal'}
              </h1>
              <span
                className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                  animal.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                }`}
              >
                {animal.status.charAt(0).toUpperCase() + animal.status.slice(1)}
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/farms/${farmId}/animals/${animalId}/edit`)}
              >
                Edit Animal
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/farms/${farmId}?tab=animals`)}
              >
                Back to Animals
              </Button>
            </div>
          </div>

          {activeTab === 'overview' && <AnimalOverview farmId={farmId} animal={animal} />}
          {activeTab === 'health' && <AnimalHealthRecords farmId={farmId} animalId={animalId} />}
          {activeTab === 'breeding' && <AnimalBreedingTimeline farmId={farmId} animalId={animalId} />}
          {activeTab === 'movements' && <AnimalMovementsTable farmId={farmId} animalId={animalId} />}
          {activeTab === 'groups' && <AnimalGroupsTable farmId={farmId} animalId={animalId} />}
        </div>
      </div>
    </div>
  );
}

