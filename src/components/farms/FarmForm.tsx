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
      } else {
        // Create new farm
        await addFarm(formData);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/farms');
      }
    } catch (err) {
      console.error('Farm operation error:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {farm ? 'Edit Farm' : 'Create New Farm'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {farm ? 'Update your farm information' : 'Add a new farm to your portfolio'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Display */}
        {(error || validationErrors.length > 0) && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            {validationErrors.length > 0 && (
              <ul className="mt-2 text-sm text-red-600 dark:text-red-400">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h3>
          
          <div>
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

        {/* Location Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Location Information</h3>
          
          <div>
            <Label>Location Address</Label>
            <Input
              type="text"
              value={formData.location_address}
              onChange={(e) => handleInputChange('location_address', e.target.value)}
              placeholder="Enter farm location address"
              data-testid="farm-location-address-input"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Size Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Size Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          
          <Button
            type="submit"
            disabled={isLoading}
            data-testid="farm-submit-button"
          >
            {isLoading ? (farm ? 'Updating...' : 'Creating...') : (farm ? 'Update Farm' : 'Create Farm')}
          </Button>
        </div>
      </form>
    </div>
  );
}
