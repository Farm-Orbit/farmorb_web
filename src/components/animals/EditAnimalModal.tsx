"use client";

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import { Animal } from '@/types/animal';

interface EditAnimalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  animal: Animal;
  farmId: string;
}

export default function EditAnimalModal({ isOpen, onClose, onSubmit, animal, farmId }: EditAnimalModalProps) {
  const [formData, setFormData] = useState({
    tag_id: animal.tag_id,
    name: animal.name || '',
    breed: animal.breed || '',
    sex: animal.sex,
    birth_date: animal.birth_date ? animal.birth_date.split('T')[0] : '',
    color: animal.color || '',
    markings: animal.markings || '',
    tracking_type: animal.tracking_type,
    status: animal.status,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData({
      tag_id: animal.tag_id,
      name: animal.name || '',
      breed: animal.breed || '',
      sex: animal.sex,
      birth_date: animal.birth_date ? animal.birth_date.split('T')[0] : '',
      color: animal.color || '',
      markings: animal.markings || '',
      tracking_type: animal.tracking_type,
      status: animal.status,
    });
  }, [animal]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.tag_id.trim()) {
      newErrors.tag_id = 'Tag ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const submitData: any = {
      tag_id: formData.tag_id,
      sex: formData.sex,
      tracking_type: formData.tracking_type,
      status: formData.status,
      ...(formData.name && { name: formData.name }),
      ...(formData.breed && { breed: formData.breed }),
      ...(formData.birth_date && { birth_date: formData.birth_date }),
      ...(formData.color && { color: formData.color }),
      ...(formData.markings && { markings: formData.markings }),
    };

    onSubmit(submitData);
  };

  const handleClose = () => {
    setFormData({
      tag_id: animal.tag_id,
      name: animal.name || '',
      breed: animal.breed || '',
      sex: animal.sex,
      birth_date: animal.birth_date ? animal.birth_date.split('T')[0] : '',
      color: animal.color || '',
      markings: animal.markings || '',
      tracking_type: animal.tracking_type,
      status: animal.status,
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[584px] p-5 lg:p-10 max-h-[90vh] overflow-y-auto">
      <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">
        Edit Animal
      </h4>

      <form onSubmit={handleSubmit}>
        <div className="space-y-5">
          {/* Tag ID */}
          <div>
            <Label>Tag ID *</Label>
            <Input 
              type="text" 
              value={formData.tag_id}
              onChange={(e) => handleInputChange('tag_id', e.target.value)}
              placeholder="e.g., TAG001"
              data-testid="edit-animal-tag-id-input"
            />
            {errors.tag_id && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tag_id}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <Label>Name</Label>
            <Input 
              type="text" 
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Bessie"
              data-testid="edit-animal-name-input"
            />
          </div>

          {/* Sex */}
          <div>
            <Label>Sex *</Label>
            <select
              value={formData.sex}
              onChange={(e) => handleInputChange('sex', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              data-testid="edit-animal-sex-select"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* Breed */}
          <div>
            <Label>Breed</Label>
            <Input 
              type="text" 
              value={formData.breed}
              onChange={(e) => handleInputChange('breed', e.target.value)}
              placeholder="e.g., Holstein"
              data-testid="edit-animal-breed-input"
            />
          </div>

          {/* Birth Date */}
          <div>
            <Label>Birth Date</Label>
            <Input 
              type="date" 
              value={formData.birth_date}
              onChange={(e) => handleInputChange('birth_date', e.target.value)}
              data-testid="edit-animal-birth-date-input"
            />
          </div>

          {/* Color */}
          <div>
            <Label>Color</Label>
            <Input 
              type="text" 
              value={formData.color}
              onChange={(e) => handleInputChange('color', e.target.value)}
              placeholder="e.g., Black and White"
              data-testid="edit-animal-color-input"
            />
          </div>

          {/* Markings */}
          <div>
            <Label>Markings</Label>
            <textarea
              value={formData.markings}
              onChange={(e) => handleInputChange('markings', e.target.value)}
              placeholder="Enter any distinctive markings"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              data-testid="edit-animal-markings-textarea"
            />
          </div>

          {/* Tracking Type */}
          <div>
            <Label>Tracking Type *</Label>
            <select
              value={formData.tracking_type}
              onChange={(e) => handleInputChange('tracking_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              data-testid="edit-animal-tracking-type-select"
            >
              <option value="individual">Individual</option>
              <option value="batch">Batch</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <Label>Status *</Label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              data-testid="edit-animal-status-select"
            >
              <option value="active">Active</option>
              <option value="sold">Sold</option>
              <option value="deceased">Deceased</option>
              <option value="culled">Culled</option>
            </select>
          </div>

        </div>

        <div className="flex items-center justify-end w-full gap-3 mt-6">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleClose}
            data-testid="cancel-edit-animal-button"
          >
            Cancel
          </Button>
          <Button 
            size="sm" 
            type="submit"
            data-testid="update-animal-submit-button"
          >
            Update Animal
          </Button>
        </div>
      </form>
    </Modal>
  );
}

