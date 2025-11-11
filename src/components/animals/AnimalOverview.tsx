"use client";

import { useEffect, useState } from 'react';
import { Animal } from '@/types/animal';
import Button from '@/components/ui/button/Button';
import { useRouter } from 'next/navigation';
import { useAnimals } from '@/hooks/useAnimals';

interface AnimalOverviewProps {
  farmId: string;
  animal: Animal;
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'sold':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'deceased':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    case 'culled':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

export default function AnimalOverview({ farmId, animal }: AnimalOverviewProps) {
  const router = useRouter();
  const { animals, getFarmAnimals } = useAnimals();

  const [sire, setSire] = useState<Animal | null>(null);
  const [dam, setDam] = useState<Animal | null>(null);
  const [isLoadingParents, setIsLoadingParents] = useState(false);

  useEffect(() => {
    const loadParents = async () => {
      if (!animal.parent_sire_id && !animal.parent_dam_id) {
        return;
      }

      setIsLoadingParents(true);
      try {
        const result = await getFarmAnimals(farmId, { page: 1, pageSize: 200 });
        if (animal.parent_sire_id) {
          const sireAnimal = result.items.find((a) => a.id === animal.parent_sire_id);
          if (sireAnimal) setSire(sireAnimal);
        }
        if (animal.parent_dam_id) {
          const damAnimal = result.items.find((a) => a.id === animal.parent_dam_id);
          if (damAnimal) setDam(damAnimal);
        }
      } catch (error) {
        console.error('Failed to load parent animals:', error);
      } finally {
        setIsLoadingParents(false);
      }
    };

    loadParents();
  }, [farmId, animal.parent_sire_id, animal.parent_dam_id, getFarmAnimals]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Animal Details</h2>
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(animal.status)}`}>
            {animal.status.charAt(0).toUpperCase() + animal.status.slice(1)}
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/farms/${farmId}/animals/${animal.id}/edit`)}
          >
            Edit Animal
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tag ID</span>
              <span className="text-sm text-gray-900 dark:text-white font-mono">{animal.tag_id}</span>
            </div>
            {animal.rfid && (
              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">RFID</span>
                <span className="text-sm text-gray-900 dark:text-white font-mono">{animal.rfid}</span>
              </div>
            )}
            {animal.name && (
              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</span>
                <span className="text-sm text-gray-900 dark:text-white">{animal.name}</span>
              </div>
            )}
            <div>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Species</span>
              <span className="text-sm text-gray-900 dark:text-white">{animal.species || 'N/A'}</span>
            </div>
            {animal.breed && (
              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Breed</span>
                <span className="text-sm text-gray-900 dark:text-white">{animal.breed}</span>
              </div>
            )}
            <div>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sex</span>
              <span className="text-sm text-gray-900 dark:text-white capitalize">{animal.sex}</span>
            </div>
            {animal.birth_date && (
              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Birth Date</span>
                <span className="text-sm text-gray-900 dark:text-white">{formatDate(animal.birth_date)}</span>
              </div>
            )}
            <div>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tracking Type</span>
              <span className="text-sm text-gray-900 dark:text-white capitalize">{animal.tracking_type}</span>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Information</h3>
          <div className="space-y-4">
            {animal.color && (
              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</span>
                <span className="text-sm text-gray-900 dark:text-white">{animal.color}</span>
              </div>
            )}
            {animal.markings && (
              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Markings</span>
                <span className="text-sm text-gray-900 dark:text-white">{animal.markings}</span>
              </div>
            )}
            {animal.parent_sire_id && (
              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sire (Father)</span>
                {isLoadingParents ? (
                  <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
                ) : sire ? (
                  <button
                    type="button"
                    onClick={() => router.push(`/farms/${farmId}/animals/${sire.id}`)}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {sire.name || sire.tag_id}
                  </button>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">{animal.parent_sire_id.slice(0, 8)}</span>
                )}
              </div>
            )}
            {animal.parent_dam_id && (
              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dam (Mother)</span>
                {isLoadingParents ? (
                  <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
                ) : dam ? (
                  <button
                    type="button"
                    onClick={() => router.push(`/farms/${farmId}/animals/${dam.id}`)}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {dam.name || dam.tag_id}
                  </button>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">{animal.parent_dam_id.slice(0, 8)}</span>
                )}
              </div>
            )}
            <div>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Created</span>
              <span className="text-sm text-gray-900 dark:text-white">{formatDate(animal.created_at)}</span>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</span>
              <span className="text-sm text-gray-900 dark:text-white">{formatDate(animal.updated_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

