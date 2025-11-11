"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import { useAnimals } from '@/hooks/useAnimals';
import {
  BreedingRecord,
  BreedingRecordType,
  BreedingStatus,
  CreateBreedingRecordRequest,
  UpdateBreedingRecordRequest,
} from '@/types/breeding';

export type BreedingFormMode = 'create' | 'edit';

export interface BreedingRecordFormProps {
  mode: BreedingFormMode;
  farmId: string;
  initialValues?: Partial<BreedingRecord>;
  onSubmit: (
    data: CreateBreedingRecordRequest | UpdateBreedingRecordRequest
  ) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
  cancelLabel?: string;
}

interface BreedingRecordFormValues {
  animal_id: string;
  record_type: BreedingRecordType;
  event_date: string;
  mate_id?: string;
  method?: 'natural' | 'ai' | 'embryo';
  status: BreedingStatus;
  gestation_days?: string;
  expected_due_date?: string;
  actual_due_date?: string;
  offspring_count?: string;
  offspring_ids?: string;
  notes?: string;
}

const defaultFormValues: BreedingRecordFormValues = {
  animal_id: '',
  record_type: 'breeding',
  event_date: '',
  mate_id: '',
  method: 'natural',
  status: 'planned',
  gestation_days: '',
  expected_due_date: '',
  actual_due_date: '',
  offspring_count: '',
  offspring_ids: '',
  notes: '',
};

const statusOptions: { value: BreedingStatus; label: string }[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'failed', label: 'Failed' },
  { value: 'completed', label: 'Completed' },
];

const recordTypeOptions: { value: BreedingRecordType; label: string }[] = [
  { value: 'heat', label: 'Heat' },
  { value: 'breeding', label: 'Breeding' },
  { value: 'pregnancy_check', label: 'Pregnancy Check' },
  { value: 'birth', label: 'Birth' },
];

const methodOptions: { value: 'natural' | 'ai' | 'embryo'; label: string }[] = [
  { value: 'natural', label: 'Natural' },
  { value: 'ai', label: 'Artificial Insemination' },
  { value: 'embryo', label: 'Embryo Transfer' },
];

const toStartOfDayISOString = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  const utcDate = new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()));
  return utcDate.toISOString();
};

export default function BreedingRecordForm({
  mode,
  farmId,
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = mode === 'edit' ? 'Save Changes' : 'Create Record',
  cancelLabel = 'Cancel',
}: BreedingRecordFormProps) {
  const { getFarmAnimals } = useAnimals();
  const [formValues, setFormValues] = useState<BreedingRecordFormValues>(defaultFormValues);
  const [animalOptions, setAnimalOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const heading = useMemo(
    () => (mode === 'edit' ? 'Edit Breeding Record' : 'Log Breeding Event'),
    [mode]
  );

  const loadAnimals = useCallback(async () => {
    try {
      const result = await getFarmAnimals(farmId, { page: 1, pageSize: 200 });
      const options = result.items.map((animal) => ({
        value: animal.id,
        label: animal.name || animal.tag_id || animal.id,
      }));
      setAnimalOptions(options);
    } catch (error) {
      console.error('Failed to load animals:', error);
    }
  }, [farmId, getFarmAnimals]);

  useEffect(() => {
    loadAnimals();
  }, [loadAnimals]);

  useEffect(() => {
    if (!initialValues) {
      return;
    }

    setFormValues((prev) => ({
      ...prev,
      animal_id: initialValues.animal_id || '',
      record_type: (initialValues.record_type as BreedingRecordType) || prev.record_type,
      event_date: initialValues.event_date ? initialValues.event_date.split('T')[0] : '',
      mate_id: initialValues.mate_id || '',
      method: (initialValues.method as BreedingRecordFormValues['method']) || prev.method,
      status: (initialValues.status as BreedingStatus) || prev.status,
      gestation_days:
        typeof initialValues.gestation_days === 'number'
          ? String(initialValues.gestation_days)
          : '',
      expected_due_date: initialValues.expected_due_date
        ? initialValues.expected_due_date.split('T')[0]
        : '',
      actual_due_date: initialValues.actual_due_date
        ? initialValues.actual_due_date.split('T')[0]
        : '',
      offspring_count:
        typeof initialValues.offspring_count === 'number'
          ? String(initialValues.offspring_count)
          : '',
      offspring_ids: initialValues.offspring_ids?.join(', ') ?? '',
      notes: initialValues.notes || '',
    }));
  }, [initialValues]);

  const handleInputChange = (field: keyof BreedingRecordFormValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formValues.animal_id) {
      nextErrors.animal_id = 'Animal is required';
    }

    if (!formValues.record_type) {
      nextErrors.record_type = 'Record type is required';
    }

    if (!formValues.event_date) {
      nextErrors.event_date = 'Event date is required';
    }

    if (!formValues.status) {
      nextErrors.status = 'Status is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (): CreateBreedingRecordRequest | UpdateBreedingRecordRequest => {
    const basePayload: CreateBreedingRecordRequest = {
      animal_id: formValues.animal_id,
      record_type: formValues.record_type,
      event_date: toStartOfDayISOString(formValues.event_date) ?? formValues.event_date,
      status: formValues.status,
    };

    if (formValues.mate_id) {
      basePayload.mate_id = formValues.mate_id;
    }

    if (formValues.method) {
      basePayload.method = formValues.method;
    }

    if (formValues.gestation_days) {
      const gestation = Number(formValues.gestation_days);
      if (!Number.isNaN(gestation)) {
        basePayload.gestation_days = gestation;
      }
    }

    if (formValues.expected_due_date) {
      basePayload.expected_due_date =
        toStartOfDayISOString(formValues.expected_due_date) ?? formValues.expected_due_date;
    }

    if (formValues.actual_due_date) {
      basePayload.actual_due_date =
        toStartOfDayISOString(formValues.actual_due_date) ?? formValues.actual_due_date;
    }

    if (formValues.offspring_count) {
      const count = Number(formValues.offspring_count);
      if (!Number.isNaN(count)) {
        basePayload.offspring_count = count;
      }
    }

    if (formValues.offspring_ids) {
      basePayload.offspring_ids = formValues.offspring_ids
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    }

    if (formValues.notes) {
      basePayload.notes = formValues.notes;
    }

    return basePayload;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const payload = buildPayload();

    try {
      setIsSubmitting(true);
      await onSubmit(payload);
    } catch (error: any) {
      const message = error?.error || error?.message || 'Failed to submit breeding record';
      setErrors((prev) => ({ ...prev, submit: message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{heading}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track breeding activity, expected due dates, and outcomes for your livestock.
          </p>
        </div>

        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-1">
            <Label>Animal *</Label>
            <select
              value={formValues.animal_id}
              onChange={(event) => handleInputChange('animal_id', event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="breeding-animal-select"
            >
              <option value="">Select animal</option>
              {animalOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.animal_id && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.animal_id}</p>
            )}
          </div>

          <div className="sm:col-span-1">
            <Label>Record Type *</Label>
            <select
              value={formValues.record_type}
              onChange={(event) => handleInputChange('record_type', event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="breeding-record-type-select"
            >
              {recordTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.record_type && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.record_type}</p>
            )}
          </div>

          <div className="sm:col-span-1">
            <Label>Event Date *</Label>
            <Input
              type="date"
              value={formValues.event_date}
              onChange={(event) => handleInputChange('event_date', event.target.value)}
              data-testid="breeding-event-date-input"
            />
            {errors.event_date && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.event_date}</p>
            )}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Mate</Label>
            <select
              value={formValues.mate_id || ''}
              onChange={(event) => handleInputChange('mate_id', event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="breeding-mate-select"
            >
              <option value="">Select mate (optional)</option>
              {animalOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Method</Label>
            <select
              value={formValues.method || ''}
              onChange={(event) => handleInputChange('method', event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="breeding-method-select"
            >
              <option value="">Select method</option>
              {methodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Status *</Label>
            <select
              value={formValues.status}
              onChange={(event) => handleInputChange('status', event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="breeding-status-select"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.status}</p>
            )}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Gestation Days</Label>
            <Input
              type="number"
              value={formValues.gestation_days ?? ''}
              onChange={(event) => handleInputChange('gestation_days', event.target.value)}
              placeholder="e.g., 283"
              data-testid="breeding-gestation-input"
            />
          </div>
          <div>
            <Label>Expected Due Date</Label>
            <Input
              type="date"
              value={formValues.expected_due_date ?? ''}
              onChange={(event) => handleInputChange('expected_due_date', event.target.value)}
              data-testid="breeding-expected-due-date-input"
            />
          </div>
          <div>
            <Label>Actual Due Date</Label>
            <Input
              type="date"
              value={formValues.actual_due_date ?? ''}
              onChange={(event) => handleInputChange('actual_due_date', event.target.value)}
              data-testid="breeding-actual-due-date-input"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Offspring Count</Label>
            <Input
              type="number"
              value={formValues.offspring_count ?? ''}
              onChange={(event) => handleInputChange('offspring_count', event.target.value)}
              placeholder="Number of offspring"
              data-testid="breeding-offspring-count-input"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Offspring IDs</Label>
            <Input
              type="text"
              value={formValues.offspring_ids ?? ''}
              onChange={(event) => handleInputChange('offspring_ids', event.target.value)}
              placeholder="Comma separated IDs"
              data-testid="breeding-offspring-ids-input"
            />
          </div>
        </div>

        <div>
          <Label>Notes</Label>
          <textarea
            value={formValues.notes ?? ''}
            onChange={(event) => handleInputChange('notes', event.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add any relevant notes about this event"
            data-testid="breeding-notes-textarea"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          data-testid="cancel-breeding-record-button"
        >
          {cancelLabel}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          data-testid="submit-breeding-record-button"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
