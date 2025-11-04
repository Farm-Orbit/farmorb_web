"use client";

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import { useAnimals } from '@/hooks/useAnimals';

interface CreateAnimalModalProps {
  onClose: () => void;
  farmId: string;
}

export default function CreateAnimalModal({ onClose, farmId }: CreateAnimalModalProps) {
  const { createAnimal } = useAnimals();
  const [formData, setFormData] = useState({
    tag_id: '',
    name: '',
    breed: '',
    sex: 'male',
    birth_date: '',
    color: '',
    markings: '',
    tracking_type: 'individual',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const submitData = {
      tag_id: formData.tag_id,
      sex: formData.sex as 'male' | 'female',
      tracking_type: formData.tracking_type as 'individual' | 'batch',
      ...(formData.name && { name: formData.name }),
      ...(formData.breed && { breed: formData.breed }),
      ...(formData.birth_date && { birth_date: formData.birth_date }),
      ...(formData.color && { color: formData.color }),
      ...(formData.markings && { markings: formData.markings }),
    };

    try {
      setIsSubmitting(true);
      await createAnimal(farmId, submitData);
      // Reset form and close modal on success
      setFormData({
        tag_id: '',
        name: '',
        breed: '',
        sex: 'male',
        birth_date: '',
        color: '',
        markings: '',
        tracking_type: 'individual',
      });
      setErrors({});
      onClose();
    } catch (error: any) {
      setErrors({ submit: error.error || 'Failed to create animal' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      tag_id: '',
      name: '',
      breed: '',
      sex: 'male',
      birth_date: '',
      color: '',
      markings: '',
      tracking_type: 'individual',
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={handleClose} className="max-w-[584px] p-5 lg:p-10 max-h-[90vh] overflow-y-auto">
      <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">
        Add New Animal
      </h4>

      {errors.submit && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
        </div>
      )}

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
              data-testid="animal-tag-id-input"
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
              data-testid="animal-name-input"
            />
          </div>

          {/* Sex */}
          <div>
            <Label>Sex *</Label>
            <select
              value={formData.sex}
              onChange={(e) => handleInputChange('sex', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              data-testid="animal-sex-select"
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
              data-testid="animal-breed-input"
            />
          </div>

          {/* Birth Date */}
          <div>
            <Label>Birth Date</Label>
            <Input 
              type="date" 
              value={formData.birth_date}
              onChange={(e) => handleInputChange('birth_date', e.target.value)}
              data-testid="animal-birth-date-input"
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
              data-testid="animal-color-input"
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
              data-testid="animal-markings-textarea"
            />
          </div>

          {/* Tracking Type */}
          <div>
            <Label>Tracking Type *</Label>
            <select
              value={formData.tracking_type}
              onChange={(e) => handleInputChange('tracking_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              data-testid="animal-tracking-type-select"
            >
              <option value="individual">Individual</option>
              <option value="batch">Batch</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end w-full gap-3 mt-6">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleClose}
            disabled={isSubmitting}
            data-testid="cancel-animal-button"
          >
            Cancel
          </Button>
          <Button 
            size="sm" 
            type="submit"
            disabled={isSubmitting}
            data-testid="create-animal-submit-button"
          >
            {isSubmitting ? 'Adding...' : 'Add Animal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

