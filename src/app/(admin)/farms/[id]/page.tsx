"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFarms } from '@/hooks/useFarms';
import { Farm } from '@/types/farm';
import Button from '@/components/ui/button/Button';

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

export default function FarmDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getFarmById, currentFarm, isLoading, error, removeFarm } = useFarms();
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

  const handleDeleteFarm = async () => {
    if (farm && window.confirm(`Are you sure you want to delete "${farm.name}"?`)) {
      try {
        await removeFarm(farm.id);
        router.push('/farms');
      } catch (err) {
        console.error('Failed to delete farm:', err);
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
          <p className="text-gray-600 dark:text-gray-400">Loading farm details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Farm</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={() => router.push('/farms')}>
            Back to Farms
          </Button>
        </div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Farm Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The farm you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => router.push('/farms')}>
            Back to Farms
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6" data-testid="farm-detail-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{farm.name}</h1>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(farm.is_active)}`}
            >
              {farm.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {farm.description || 'No description provided'}
          </p>
        </div>
        
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Button
            variant="outline"
            onClick={() => router.push(`/farms/${farm.id}/edit`)}
            data-testid="edit-farm-button"
          >
            Edit Farm
          </Button>
          <Button
            variant="outline"
            onClick={handleDeleteFarm}
            data-testid="delete-farm-button"
          >
            Delete Farm
          </Button>
        </div>
      </div>

      {/* Farm Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Farm Type</span>
              <span className="text-gray-900 dark:text-white">{farmTypeLabels[farm.farm_type] || farm.farm_type || 'Unknown'}</span>
            </div>
            
            <div>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Size</span>
              <span className="text-gray-900 dark:text-white">{formatSize(farm.size_acres, farm.size_hectares)}</span>
            </div>
            
            <div>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
              <span
                className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(farm.is_active)}`}
              >
                {farm.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Location Information</h2>
          
          <div className="space-y-4">
            <div>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</span>
              <span className="text-gray-900 dark:text-white">{farm.location_address || 'N/A'}</span>
            </div>
            
            {(farm.location_latitude && farm.location_longitude) && (
              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Coordinates</span>
                <span className="text-gray-900 dark:text-white">
                  {farm.location_latitude}, {farm.location_longitude}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Information</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Created</span>
            <span className="text-gray-900 dark:text-white">{formatDate(farm.created_at)}</span>
          </div>
          
          <div>
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</span>
            <span className="text-gray-900 dark:text-white">{formatDate(farm.updated_at)}</span>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="mt-6">
        <Button
          variant="outline"
          onClick={() => router.push('/farms')}
          data-testid="back-to-farms-button"
        >
          Back to Farms
        </Button>
      </div>
    </div>
  );
}

