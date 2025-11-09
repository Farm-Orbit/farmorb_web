"use client";

import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/button/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import { CreateGroupRequest, UpdateGroupRequest } from '@/types/group';

export type GroupFormMode = 'create' | 'edit';

export interface GroupFormValues {
  name: string;
  purpose: string;
  description: string;
  location: string;
  color: string;
}

export interface GroupFormProps {
  mode: GroupFormMode;
  initialValues?: Partial<GroupFormValues>;
  onSubmit: (data: Partial<CreateGroupRequest & UpdateGroupRequest>) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  submitTestId?: string;
  cancelTestId?: string;
}

const defaultValues: GroupFormValues = {
  name: '',
  purpose: '',
  description: '',
  location: '',
  color: '#3B82F6',
};

export default function GroupForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  submitLabel,
  cancelLabel,
  submitTestId = 'submit-group-button',
  cancelTestId = 'cancel-group-button',
}: GroupFormProps) {
  const [formData, setFormData] = useState<GroupFormValues>({
    ...defaultValues,
    ...initialValues,
    color: initialValues?.color ?? defaultValues.color,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const heading = useMemo(() => (mode === 'edit' ? 'Edit Group' : 'Create Group'), [mode]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      ...initialValues,
      color: initialValues?.color ?? prev.color,
      name: initialValues?.name ?? prev.name,
      purpose: initialValues?.purpose ?? prev.purpose,
      description: initialValues?.description ?? prev.description,
      location: initialValues?.location ?? prev.location,
    }));
  }, [initialValues]);

  const handleInputChange = (field: keyof GroupFormValues, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      nextErrors.name = 'Group name is required';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const payload: Partial<CreateGroupRequest & UpdateGroupRequest> = {
      name: formData.name,
      ...(formData.purpose && { purpose: formData.purpose }),
      ...(formData.description && { description: formData.description }),
      ...(formData.location && { location: formData.location }),
      ...(formData.color && { color: formData.color }),
    };

    try {
      setIsSubmitting(true);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.submit;
        return next;
      });
      await onSubmit(payload);
    } catch (error: any) {
      const message = error?.error || error?.message || 'Failed to submit form';
      setErrors((prev) => ({ ...prev, submit: message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-4xl mx-auto">
      <div className="space-y-6">
        <h4 className="text-lg font-medium text-gray-800 dark:text-white/90">{heading}</h4>

        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
          <div>
            <Label>Location</Label>
            <Input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="e.g., Barn A, Pasture 3"
              data-testid="group-location-input"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-1">
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
          <div className="hidden lg:block" aria-hidden="true" />
          <div className="hidden lg:block" aria-hidden="true" />
        </div>

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
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          data-testid={cancelTestId}
          className="w-full sm:w-auto"
        >
          {cancelLabel ?? 'Cancel'}
        </Button>
        <Button
          size="sm"
          type="submit"
          disabled={isSubmitting}
          data-testid={submitTestId}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (submitLabel ? `${submitLabel}...` : 'Saving...') : submitLabel ?? 'Save Group'}
        </Button>
      </div>
    </form>
  );
}
