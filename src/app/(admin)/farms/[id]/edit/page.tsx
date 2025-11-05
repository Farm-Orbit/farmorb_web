"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FarmForm from '@/components/farms/FarmForm';
import { useFarms } from '@/hooks/useFarms';
import { Farm } from '@/types/farm';

export default function EditFarmPage() {
  const params = useParams();
  const router = useRouter();
  const { getFarmById, currentFarm, isLoading, error } = useFarms();
  const [farm, setFarm] = useState<Farm | null>(null);

  const farmId = params.id as string;

  useEffect(() => {
    if (farmId) {
      getFarmById(farmId);
    }
  }, [farmId, getFarmById]);

  useEffect(() => {
    if (currentFarm) {
      setFarm(currentFarm);
    }
  }, [currentFarm]);

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
          <button
            onClick={() => router.push('/farms')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Farms
          </button>
        </div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Farm Not Found</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The farm you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <button
            onClick={() => router.push('/farms')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Farms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="edit-farm-page">
      <FarmForm 
        farm={farm} 
        onSuccess={() => router.push('/farms')}
        onCancel={() => router.push('/farms')}
      />
    </div>
  );
}

