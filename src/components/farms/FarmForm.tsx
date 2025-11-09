"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFarms } from '@/hooks/useFarms';
import { CreateFarmData, Farm } from '@/types/farm';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';

interface FarmFormProps {
  farm?: Farm;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const farmTypes = [
  { value: 'crop', label: 'Crop Farm' },
  { value: 'livestock', label: 'Livestock Farm' },
  { value: 'mixed', label: 'Mixed Farm' },
  { value: 'dairy', label: 'Dairy Farm' },
  { value: 'poultry', label: 'Poultry Farm' },
  { value: 'other', label: 'Other' },
];

export default function FarmForm({ farm, onSuccess, onCancel }: FarmFormProps) {
  const router = useRouter();
  const { addFarm, editFarm, isLoading, error, clearFarmError } = useFarms();
  
  const [formData, setFormData] = useState<CreateFarmData>({
    name: '',
    description: '',
    farm_type: 'crop',
    location_address: '',
    location_latitude: undefined,
    location_longitude: undefined,
    size_acres: undefined,
    size_hectares: undefined,
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Initialize form with farm data if editing
  useEffect(() => {
    if (farm) {
      setFormData({
        name: farm.name,
        description: farm.description || '',
        farm_type: farm.farm_type || 'crop',
        location_address: farm.location_address || '',
        location_latitude: farm.location_latitude,
        location_longitude: farm.location_longitude,
        size_acres: farm.size_acres,
        size_hectares: farm.size_hectares,
      });
    }
  }, [farm]);

  // Clear errors when component mounts
  useEffect(() => {
    clearFarmError();
  }, [clearFarmError]);

  // Clear validation errors when user starts typing
  useEffect(() => {
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  }, [formData, validationErrors.length]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push('Farm name is required');
    }

    if (formData.size_acres && formData.size_acres <= 0) {
      errors.push('Farm size in acres must be greater than 0');
    }

    if (formData.size_hectares && formData.size_hectares <= 0) {
      errors.push('Farm size in hectares must be greater than 0');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (farm) {
        // Update existing farm
        await editFarm(farm.id, { ...formData, id: farm.id });
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/farms');
        }
      } else {
        // Create new farm
        const createdFarm = await addFarm(formData);
        if (onSuccess) {
          onSuccess(); 
        } else {
          // Redirect to the newly created farm detail page
          router.push(`/farms/${createdFarm.id}`);
        }
      }
    } catch (err) {
      console.error('Farm operation error:', err);
    }
  };

  return (
    <div className="w-full p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {farm ? 'Edit Farm' : 'Create New Farm'}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {farm ? 'Update your farm information' : 'Add a new farm to your portfolio'}
          </p>
        </div>
 
      <form onSubmit={handleSubmit} className="space-y-8">
        {(error || validationErrors.length > 0) && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            {validationErrors.length > 0 && (
              <ul className="mt-2 text-sm text-red-600 dark:text-red-400">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2">
              <Label>
                Farm Name <span className="text-error-500">*</span>
              </Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter farm name"
                data-testid="farm-name-input"
              />
            </div>
            <div>
              <Label>Farm Type</Label>
              <select
                value={formData.farm_type}
                onChange={(e) => handleInputChange('farm_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                data-testid="farm-type-select"
              >
                {farmTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter farm description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              data-testid="farm-description-input"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Location Information</h2>
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Label>Location Address</Label>
              <Input
                type="text"
                value={formData.location_address}
                onChange={(e) => handleInputChange('location_address', e.target.value)}
                placeholder="Enter farm location address"
                data-testid="farm-location-address-input"
              />
            </div>
            <div className="lg:col-span-1 grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step={0.000001}
                  value={formData.location_latitude?.toString() || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange('location_latitude', value === '' ? undefined : parseFloat(value));
                  }}
                  placeholder="Latitude"
                  data-testid="farm-latitude-input"
                />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step={0.000001}
                  value={formData.location_longitude?.toString() || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange('location_longitude', value === '' ? undefined : parseFloat(value));
                  }}
                  placeholder="Longitude"
                  data-testid="farm-longitude-input"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Size Information</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label>Size in Acres</Label>
              <Input
                type="number"
                step={0.01}
                min="0"
                value={formData.size_acres?.toString() || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  handleInputChange('size_acres', value === '' ? undefined : parseFloat(value));
                }}
                placeholder="Enter farm size in acres"
                data-testid="farm-size-acres-input"
              />
            </div>
            <div>
              <Label>Size in Hectares</Label>
              <Input
                type="number"
                step={0.01}
                min="0"
                value={formData.size_hectares?.toString() || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  handleInputChange('size_hectares', value === '' ? undefined : parseFloat(value));
                }}
                placeholder="Enter farm size in hectares"
                data-testid="farm-size-hectares-input"
              />
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end border-t border-gray-200 dark:border-gray-700 pt-6">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            data-testid="farm-submit-button"
            className="w-full sm:w-auto"
          >
            {isLoading ? (farm ? 'Updating...' : 'Creating...') : (farm ? 'Update Farm' : 'Create Farm')}
          </Button>
        </div>
      </form>
      </div>
    </div>
  );
}
