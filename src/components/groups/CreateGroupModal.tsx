"use client";

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import { GroupService } from '@/services/groupService';
import { CreateGroupRequest } from '@/types/group';

interface CreateGroupModalProps {
  farmId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateGroupModal({ farmId, onClose, onSuccess }: CreateGroupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    purpose: '',
    description: '',
    color: '#3B82F6',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData: CreateGroupRequest = {
        name: formData.name,
        ...(formData.purpose && { purpose: formData.purpose }),
        ...(formData.description && { description: formData.description }),
        ...(formData.color && { color: formData.color }),
      };

      await GroupService.createGroup(farmId, submitData);
      
      // Reset form
      setFormData({
        name: '',
        purpose: '',
        description: '',
        color: '#3B82F6',
      });
      setErrors({});
      onSuccess();
    } catch (err: any) {
      console.error('Failed to create group:', err);
      setErrors({ submit: err.error || err.message || 'Failed to create group' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      purpose: '',
      description: '',
      color: '#3B82F6',
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={handleClose} className="max-w-[584px] p-5 lg:p-10">
      <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">
        Create New Group
      </h4>

      <form onSubmit={handleSubmit}>
        <div className="space-y-5">
          {/* Group Name */}
          <div>
            <Label>Group Name *</Label>
            <Input 
              type="text" 
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Breeding Stock, Market Ready"
              data-testid="group-name-input"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Purpose */}
          <div>
            <Label>Purpose</Label>
            <Input 
              type="text" 
              value={formData.purpose}
              onChange={(e) => handleInputChange('purpose', e.target.value)}
              placeholder="e.g., Breeding, Fattening, Market"
              data-testid="group-purpose-input"
            />
          </div>

          {/* Color */}
          <div>
            <Label>Color</Label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                data-testid="group-color-input"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Choose a color to identify this group
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter group description (optional)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              data-testid="group-description-textarea"
            />
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end w-full gap-3 mt-6">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleClose}
            disabled={isSubmitting}
            data-testid="cancel-group-button"
          >
            Cancel
          </Button>
          <Button 
            size="sm" 
            type="submit"
            disabled={isSubmitting}
            data-testid="create-group-submit-button"
          >
            {isSubmitting ? 'Creating...' : 'Create Group'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

