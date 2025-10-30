"use client";

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import { Herd } from '@/types/herd';

interface EditHerdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  herd: Herd;
}

export default function EditHerdModal({ isOpen, onClose, onSubmit, herd }: EditHerdModalProps) {
  const [formData, setFormData] = useState({
    name: herd.name,
    purpose: herd.purpose || '',
    location: herd.location || '',
    species_type: herd.species_type,
    description: herd.description || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData({
      name: herd.name,
      purpose: herd.purpose || '',
      location: herd.location || '',
      species_type: herd.species_type,
      description: herd.description || '',
    });
  }, [herd]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Herd name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const submitData = {
      name: formData.name,
      species_type: formData.species_type,
      ...(formData.purpose && { purpose: formData.purpose }),
      ...(formData.location && { location: formData.location }),
      ...(formData.description && { description: formData.description }),
    };

    onSubmit(submitData);
  };

  const handleClose = () => {
    setFormData({
      name: herd.name,
      purpose: herd.purpose || '',
      location: herd.location || '',
      species_type: herd.species_type,
      description: herd.description || '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[584px] p-5 lg:p-10">
      <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">
        Edit Herd
      </h4>

      <form onSubmit={handleSubmit}>
        <div className="space-y-5">
          {/* Herd Name */}
          <div>
            <Label>Herd Name *</Label>
            <Input 
              type="text" 
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Dairy Herd A"
              data-testid="edit-herd-name-input"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Purpose */}
          <div>
            <Label>Purpose</Label>
            <select
              value={formData.purpose}
              onChange={(e) => handleInputChange('purpose', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              data-testid="edit-herd-purpose-select"
            >
              <option value="">Select purpose (optional)</option>
              <option value="dairy">Dairy</option>
              <option value="beef">Beef</option>
              <option value="breeding">Breeding</option>
              <option value="weaners">Weaners</option>
              <option value="poultry">Poultry</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <Label>Location</Label>
            <Input 
              type="text" 
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="e.g., Pasture 1, Pen A"
              data-testid="edit-herd-location-input"
            />
          </div>

          {/* Species Type */}
          <div>
            <Label>Species Type *</Label>
            <select
              value={formData.species_type}
              onChange={(e) => handleInputChange('species_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              data-testid="edit-herd-species-select"
            >
              <option value="mammal">Mammal</option>
              <option value="poultry">Poultry</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter herd description (optional)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              data-testid="edit-herd-description-textarea"
            />
          </div>
        </div>

        <div className="flex items-center justify-end w-full gap-3 mt-6">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleClose}
            data-testid="cancel-edit-herd-button"
          >
            Cancel
          </Button>
          <Button 
            size="sm" 
            type="submit"
            data-testid="update-herd-submit-button"
          >
            Update Herd
          </Button>
        </div>
      </form>
    </Modal>
  );
}

