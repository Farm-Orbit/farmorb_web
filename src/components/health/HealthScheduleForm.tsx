"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import { useAnimals } from '@/hooks/useAnimals';
import { useGroups } from '@/hooks/useGroups';
import {
  CreateHealthScheduleRequest,
  HealthSchedule,
  HealthScheduleFrequencyType,
  HealthScheduleTargetType,
  UpdateHealthScheduleRequest,
} from '@/types/health';

export type HealthScheduleFormMode = 'create' | 'edit';

interface HealthScheduleFormProps {
  mode: HealthScheduleFormMode;
  farmId: string;
  initialValues?: Partial<HealthSchedule>;
  onSubmit: (data: CreateHealthScheduleRequest | UpdateHealthScheduleRequest) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
  cancelLabel?: string;
}

interface HealthScheduleFormValues {
  target_type: HealthScheduleTargetType;
  target_id: string;
  name: string;
  description?: string;
  frequency_type: HealthScheduleFrequencyType;
  frequency_interval_days?: string;
  start_date: string;
  lead_time_days?: string;
}

const defaultValues: HealthScheduleFormValues = {
  target_type: 'animal',
  target_id: '',
  name: '',
  description: '',
  frequency_type: 'once',
  frequency_interval_days: '',
  start_date: '',
  lead_time_days: '0',
};

const targetOptions: { value: HealthScheduleTargetType; label: string }[] = [
  { value: 'animal', label: 'Animal' },
  { value: 'group', label: 'Group' },
];

const frequencyOptions: { value: HealthScheduleFrequencyType; label: string }[] = [
  { value: 'once', label: 'One-time' },
  { value: 'recurring', label: 'Recurring' },
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

export default function HealthScheduleForm({
  mode,
  farmId,
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = mode === 'edit' ? 'Save Changes' : 'Create Schedule',
  cancelLabel = 'Cancel',
}: HealthScheduleFormProps) {
  const { getFarmAnimals } = useAnimals();
  const { getFarmGroups } = useGroups();

  const [formValues, setFormValues] = useState<HealthScheduleFormValues>(defaultValues);
  const [animalOptions, setAnimalOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [groupOptions, setGroupOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const heading = useMemo(
    () => (mode === 'edit' ? 'Edit Health Schedule' : 'Create Health Schedule'),
    [mode]
  );

  const loadAnimalsAndGroups = useCallback(async () => {
    try {
      const [animals, groups] = await Promise.all([
        getFarmAnimals(farmId, { page: 1, pageSize: 200 }),
        getFarmGroups(farmId, { page: 1, pageSize: 200 }),
      ]);

      setAnimalOptions(
        animals.items.map((animal) => ({
          value: animal.id,
          label: animal.name || animal.tag_id || animal.id,
        }))
      );
      setGroupOptions(
        groups.items.map((group) => ({
          value: group.id,
          label: group.name || group.id,
        }))
      );
    } catch (error) {
      console.error('Failed to load animals/groups for schedule form:', error);
    }
  }, [farmId, getFarmAnimals, getFarmGroups]);

  useEffect(() => {
    loadAnimalsAndGroups();
  }, [loadAnimalsAndGroups]);

  useEffect(() => {
    if (!initialValues) {
      return;
    }

    setFormValues((prev) => ({
      ...prev,
      target_type: (initialValues.target_type as HealthScheduleTargetType) || prev.target_type,
      target_id: initialValues.target_id || '',
      name: initialValues.name || '',
      description: initialValues.description || '',
      frequency_type: (initialValues.frequency_type as HealthScheduleFrequencyType) || prev.frequency_type,
      frequency_interval_days:
        typeof initialValues.frequency_interval_days === 'number'
          ? String(initialValues.frequency_interval_days)
          : '',
      start_date: initialValues.start_date ? initialValues.start_date.split('T')[0] : '',
      lead_time_days:
        typeof initialValues.lead_time_days === 'number'
          ? String(initialValues.lead_time_days)
          : prev.lead_time_days,
    }));
  }, [initialValues]);

  const handleInputChange = (field: keyof HealthScheduleFormValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formValues.target_id) {
      nextErrors.target_id = 'Target is required';
    }

    if (!formValues.name.trim()) {
      nextErrors.name = 'Schedule name is required';
    }

    if (!formValues.start_date) {
      nextErrors.start_date = 'Start date is required';
    }

    if (formValues.frequency_type === 'recurring' && !formValues.frequency_interval_days) {
      nextErrors.frequency_interval_days = 'Interval is required for recurring schedules';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (): CreateHealthScheduleRequest | UpdateHealthScheduleRequest => {
    const payload: CreateHealthScheduleRequest = {
      target_type: formValues.target_type,
      target_id: formValues.target_id,
      name: formValues.name,
      frequency_type: formValues.frequency_type,
      start_date: toStartOfDayISOString(formValues.start_date) ?? formValues.start_date,
      lead_time_days: formValues.lead_time_days ? Number(formValues.lead_time_days) : 0,
    };

    if (formValues.description) {
      payload.description = formValues.description;
    }

    if (formValues.frequency_type === 'recurring' && formValues.frequency_interval_days) {
      const interval = Number(formValues.frequency_interval_days);
      if (!Number.isNaN(interval)) {
        payload.frequency_interval_days = interval;
      }
    }

    return payload;
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
      const message = error?.error || error?.message || 'Failed to submit health schedule';
      setErrors((prev) => ({ ...prev, submit: message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableTargets = useMemo(() => {
    if (formValues.target_type === 'animal') {
      return animalOptions;
    }
    return groupOptions;
  }, [animalOptions, formValues.target_type, groupOptions]);

  useEffect(() => {
    // Reset target id when target type changes to avoid mismatched IDs
    setFormValues((prev) => ({ ...prev, target_id: '' }));
  }, [formValues.target_type]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{heading}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Automate health reminders for animals or groups to stay on top of vaccinations, inspections, and treatments.
          </p>
        </div>

        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Target Type *</Label>
            <select
              value={formValues.target_type}
              onChange={(event) => handleInputChange('target_type', event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="health-schedule-target-type-select"
            >
              {targetOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>{formValues.target_type === 'animal' ? 'Animal *' : 'Group *'}</Label>
            <select
              value={formValues.target_id}
              onChange={(event) => handleInputChange('target_id', event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="health-schedule-target-select"
            >
              <option value="">
                {formValues.target_type === 'animal' ? 'Select animal' : 'Select group'}
              </option>
              {availableTargets.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.target_id && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.target_id}</p>
            )}
          </div>

          <div>
            <Label>Schedule Name *</Label>
            <Input
              type="text"
              value={formValues.name}
              onChange={(event) => handleInputChange('name', event.target.value)}
              placeholder="e.g., Quarterly Vaccination"
              data-testid="health-schedule-name-input"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Frequency *</Label>
            <select
              value={formValues.frequency_type}
              onChange={(event) => handleInputChange('frequency_type', event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="health-schedule-frequency-select"
            >
              {frequencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Interval (days)</Label>
            <Input
              type="number"
              value={formValues.frequency_interval_days ?? ''}
              onChange={(event) => handleInputChange('frequency_interval_days', event.target.value)}
              placeholder="Required for recurring"
              disabled={formValues.frequency_type === 'once'}
              data-testid="health-schedule-interval-input"
            />
            {errors.frequency_interval_days && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.frequency_interval_days}</p>
            )}
          </div>

          <div>
            <Label>Start Date *</Label>
            <Input
              type="date"
              value={formValues.start_date}
              onChange={(event) => handleInputChange('start_date', event.target.value)}
              data-testid="health-schedule-start-date-input"
            />
            {errors.start_date && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.start_date}</p>
            )}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Lead Time (days)</Label>
            <Input
              type="number"
              value={formValues.lead_time_days ?? ''}
              onChange={(event) => handleInputChange('lead_time_days', event.target.value)}
              placeholder="Reminder lead time"
              min="0"
              data-testid="health-schedule-lead-time-input"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-2">
            <Label>Description</Label>
          <textarea
            value={formValues.description ?? ''}
            onChange={(event) => handleInputChange('description', event.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add details or preparation notes for this schedule"
            data-testid="health-schedule-description-textarea"
          />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="cancel-health-schedule-button">
          {cancelLabel}
        </Button>
        <Button type="submit" disabled={isSubmitting} data-testid="submit-health-schedule-button">
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
