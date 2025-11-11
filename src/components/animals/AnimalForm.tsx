"use client";

import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/button/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import { CreateAnimalData } from '@/types/animal';

export type AnimalFormMode = 'create' | 'edit';

export interface AnimalFormValues {
  tag_id: string;
  species: string;
  name: string;
  breed: string;
  sex: 'male' | 'female';
  birth_date: string;
  color: string;
  markings: string;
  tracking_type: 'individual' | 'batch';
  status?: 'active' | 'sold' | 'deceased' | 'culled';
}

export interface AnimalFormProps {
  mode: AnimalFormMode;
  initialValues?: Partial<AnimalFormValues>;
  onSubmit: (data: Partial<CreateAnimalData & { status?: string }>) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
  cancelLabel?: string;
}

const defaultValues: AnimalFormValues = {
  tag_id: '',
  species: 'cattle',
  name: '',
  breed: '',
  sex: 'male',
  birth_date: '',
  color: '',
  markings: '',
  tracking_type: 'individual',
  status: 'active',
};

const speciesOptions: Array<{ value: string; label: string }> = [
  { value: 'cattle', label: 'Cattle' },
  { value: 'goat', label: 'Goat' },
  { value: 'sheep', label: 'Sheep' },
  { value: 'pig', label: 'Pig' },
  { value: 'poultry', label: 'Poultry' },
  { value: 'horse', label: 'Horse' },
  { value: 'camel', label: 'Camel' },
  { value: 'other', label: 'Other' },
];

export default function AnimalForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  submitLabel,
  cancelLabel,
}: AnimalFormProps) {
  const [formData, setFormData] = useState<AnimalFormValues>(() => ({
    ...defaultValues,
    ...initialValues,
    species: initialValues?.species ?? defaultValues.species,
    sex: (initialValues?.sex as 'male' | 'female') ?? 'male',
    tracking_type: (initialValues?.tracking_type as 'individual' | 'batch') ?? 'individual',
    status: (initialValues?.status as AnimalFormValues['status']) ?? defaultValues.status,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showStatusField = useMemo(() => mode === 'edit', [mode]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      ...initialValues,
      species: initialValues?.species ?? prev.species,
      sex: (initialValues?.sex as 'male' | 'female') ?? prev.sex,
      tracking_type: (initialValues?.tracking_type as 'individual' | 'batch') ?? prev.tracking_type,
      status: (initialValues?.status as AnimalFormValues['status']) ?? prev.status,
      tag_id: initialValues?.tag_id ?? prev.tag_id,
      name: initialValues?.name ?? prev.name,
      breed: initialValues?.breed ?? prev.breed,
      birth_date: initialValues?.birth_date ?? prev.birth_date,
      color: initialValues?.color ?? prev.color,
      markings: initialValues?.markings ?? prev.markings,
    }));
  }, [initialValues]);

  const handleInputChange = (field: keyof AnimalFormValues, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field as string];
      return next;
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.tag_id.trim()) {
      newErrors.tag_id = 'Tag ID is required';
    }

    if (!formData.species.trim()) {
      newErrors.species = 'Species is required';
    }

    if (!formData.sex) {
      newErrors.sex = 'Sex is required';
    }

    if (!formData.tracking_type) {
      newErrors.tracking_type = 'Tracking type is required';
    }

    if (showStatusField && !formData.status) {
      newErrors.status = 'Status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const submitData: Partial<CreateAnimalData & { status?: string }> = {
      tag_id: formData.tag_id,
      species: formData.species,
      sex: formData.sex,
      tracking_type: formData.tracking_type,
      ...(formData.name && { name: formData.name }),
      ...(formData.breed && { breed: formData.breed }),
      ...(formData.birth_date && { birth_date: formData.birth_date }),
      ...(formData.color && { color: formData.color }),
      ...(formData.markings && { markings: formData.markings }),
      ...(showStatusField && formData.status && { status: formData.status }),
    };

    try {
      setIsSubmitting(true);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.submit;
        return next;
      });
      await onSubmit(submitData);
    } catch (error: any) {
      const message = error?.error || error?.message || (typeof error === 'string' ? error : 'Failed to submit form');
      setErrors((prev) => ({ ...prev, submit: message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-4xl mx-auto">
      <div className="space-y-6">
        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
          <div>
            <Label>Species *</Label>
            <select
              value={formData.species}
              onChange={(e) => handleInputChange('species', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              data-testid="animal-species-select"
            >
              {speciesOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.species && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.species}</p>
            )}
          </div>
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
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Sex *</Label>
            <select
              value={formData.sex}
              onChange={(e) => handleInputChange('sex', e.target.value as AnimalFormValues['sex'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              data-testid="animal-sex-select"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            {errors.sex && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.sex}</p>
            )}
          </div>
          <div>
            <Label>Tracking Type *</Label>
            <select
              value={formData.tracking_type}
              onChange={(e) => handleInputChange('tracking_type', e.target.value as AnimalFormValues['tracking_type'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              data-testid="animal-tracking-type-select"
            >
              <option value="individual">Individual</option>
              <option value="batch">Batch</option>
            </select>
            {errors.tracking_type && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tracking_type}</p>
            )}
          </div>
          <div>
            <Label>Birth Date</Label>
            <Input
              type="date"
              value={formData.birth_date}
              onChange={(e) => handleInputChange('birth_date', e.target.value)}
              data-testid="animal-birth-date-input"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-1">
            <Label>Color</Label>
            <Input
              type="text"
              value={formData.color}
              onChange={(e) => handleInputChange('color', e.target.value)}
              placeholder="e.g., Black and White"
              data-testid="animal-color-input"
            />
          </div>
          {showStatusField ? (
            <div className="sm:col-span-1">
              <Label>Status *</Label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as AnimalFormValues['status'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                data-testid="animal-status-select"
              >
                <option value="active">Active</option>
                <option value="sold">Sold</option>
                <option value="deceased">Deceased</option>
                <option value="culled">Culled</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.status}</p>
              )}
            </div>
          ) : (
            <div className="hidden lg:block" aria-hidden="true" />
          )}
          <div className="hidden lg:block" aria-hidden="true" />
        </div>

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
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          data-testid="cancel-animal-button"
          className="w-full sm:w-auto"
        >
          {cancelLabel ?? 'Cancel'}
        </Button>
        <Button
          size="sm"
          type="submit"
          disabled={isSubmitting}
          data-testid="submit-animal-button"
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (submitLabel ? `${submitLabel}...` : 'Saving...') : submitLabel ?? 'Save Animal'}
        </Button>
      </div>
    </form>
  );
}
