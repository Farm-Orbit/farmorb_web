"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFarms } from '@/hooks/useFarms';
import { Farm } from '@/types/farm';
import Button from '@/components/ui/button/Button';

interface FarmListProps {
  onEditFarm?: (farm: Farm) => void;
  onDeleteFarm?: (farm: Farm) => void;
}

const farmTypeLabels: Record<string, string> = {
  crop: 'Crop Farm',
  livestock: 'Livestock Farm',
  mixed: 'Mixed Farm',
  dairy: 'Dairy Farm',
  poultry: 'Poultry Farm',
  other: 'Other',
};

export default function FarmList({ onEditFarm, onDeleteFarm }: FarmListProps) {
  const router = useRouter();
  const {
    farms,
    isLoading,
    error,
    getFarms,
    removeFarm,
    clearFarmError,
  } = useFarms();

  useEffect(() => {
    getFarms();
  }, [getFarms]);

  useEffect(() => {
    if (error) {
      console.error('FarmList Error:', error);
    }
  }, [error]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this farm?')) {
      try {
        await removeFarm(id);
        getFarms(); // Refresh list
      } catch (err) {
        console.error('Failed to delete farm:', err);
      }
    }
  };

  return (
    <div className="space-y-6" data-testid="farms-page">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Farms</h1>
        <Button onClick={() => router.push('/farms/create')} data-testid="create-farm-button">
          Create New Farm
        </Button>
      </div>

      {isLoading && <p className="text-center text-gray-500 dark:text-gray-400">Loading farms...</p>}
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {!isLoading && !error && farms && farms.length === 0 && (
        <div className="text-center p-8 bg-white dark:bg-gray-dark rounded-lg shadow-md">
          <h3 className="text-lg text-gray-600 dark:text-gray-400">No farms found</h3>
          <p className="text-gray-500 dark:text-gray-500 mt-2">
            Get started by creating your first farm
          </p>
          <Button 
            onClick={() => router.push('/farms/create')} 
            className="mt-4"
            data-testid="create-first-farm-button"
          >
            Create Your First Farm
          </Button>
        </div>
      )}

      {!isLoading && farms && farms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farms.map((farm) => (
            <div
              key={farm.id}
              className="bg-white dark:bg-gray-dark rounded-lg shadow-md p-6 space-y-3 border border-gray-200 dark:border-gray-800"
              data-testid={`farm-card-${farm.id}`}
            >
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{farm.name || 'Unnamed Farm'}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                <span className="font-medium">Type:</span> {farmTypeLabels[farm.farm_type] || farm.farm_type || 'Unknown'}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                <span className="font-medium">Status:</span>{' '}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    farm.is_active 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                  }`}
                >
                  {farm.is_active ? 'Active' : 'Inactive'}
                </span>
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                <span className="font-medium">Size:</span> {
                  farm.size_acres ? `${farm.size_acres} acres` : 
                  farm.size_hectares ? `${farm.size_hectares} hectares` : 
                  'N/A'
                }
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                <span className="font-medium">Location:</span> {farm.location_address || 'N/A'}
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/farms/${farm.id}`)}
                  data-testid={`farm-view-button-${farm.id}`}
                >
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/farms/${farm.id}/edit`)}
                  data-testid={`farm-edit-button-${farm.id}`}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(farm.id)}
                  data-testid={`farm-delete-button-${farm.id}`}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}