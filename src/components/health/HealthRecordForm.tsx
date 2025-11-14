"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import { useAnimals } from '@/hooks/useAnimals';
import { useGroups } from '@/hooks/useGroups';
import { useFarmMembers } from '@/hooks/useFarmMembers';
import {
  CreateHealthRecordRequest,
  HealthRecord,
  HealthRecordType,
  UpdateHealthRecordRequest,
} from '@/types/health';
import { FarmMemberResponse } from '@/types/farmMember';
import { getTodayDateString, formatDateForInput } from '@/utils/dateUtils';

export type HealthRecordFormMode = 'create' | 'edit';

interface HealthRecordFormProps {
  mode: HealthRecordFormMode;
  farmId: string;
  initialValues?: Partial<HealthRecord>;
  onSubmit: (data: CreateHealthRecordRequest | UpdateHealthRecordRequest) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
  cancelLabel?: string;
}

interface HealthRecordFormValues {
  animal_id?: string;
  group_id?: string;
  record_type: HealthRecordType;
  title: string;
  description?: string;
  performed_at: string;
  performed_by?: string;
  vet_name?: string;
  medication?: string;
  dosage?: string;
  withdrawal_period_days?: string;
  cost?: string;
  follow_up_date?: string;
  outcome?: string;
  health_score?: string;
  notes?: string;
}

const defaultFormValues: HealthRecordFormValues = {
  animal_id: '',
  group_id: '',
  record_type: 'treatment',
  title: '',
  description: '',
  performed_at: getTodayDateString(),
  performed_by: '',
  vet_name: '',
  medication: '',
  dosage: '',
  withdrawal_period_days: '',
  cost: '',
  follow_up_date: '',
  outcome: '',
  health_score: '',
  notes: '',
};

const recordTypeOptions: { value: HealthRecordType; label: string }[] = [
  { value: 'treatment', label: 'Treatment' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'injury', label: 'Injury' },
  { value: 'note', label: 'Note' },
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

export default function HealthRecordForm({
  mode,
  farmId,
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = mode === 'edit' ? 'Save Changes' : 'Create Health Record',
  cancelLabel = 'Cancel',
}: HealthRecordFormProps) {
  const { getAnimalById } = useAnimals();
  const { getGroupById } = useGroups();
  const { getFarmMembers } = useFarmMembers();

  const [formValues, setFormValues] = useState<HealthRecordFormValues>(defaultFormValues);
  const [preSelectedAnimalName, setPreSelectedAnimalName] = useState<string>('');
  const [preSelectedGroupName, setPreSelectedGroupName] = useState<string>('');
  const [memberOptions, setMemberOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const heading = useMemo(
    () => (mode === 'edit' ? 'Edit Health Record' : 'Record Health Event'),
    [mode]
  );

  // Helper function to format member display name
  const getMemberDisplayName = useCallback((member: FarmMemberResponse): string => {
    if (member.first_name && member.last_name) {
      return `${member.first_name} ${member.last_name}`;
    }
    if (member.first_name) {
      return member.first_name;
    }
    if (member.last_name) {
      return member.last_name;
    }
    if (member.email) {
      return member.email;
    }
    return 'Member';
  }, []);

  // Load farm members for the performed_by dropdown
  const loadFarmMembers = useCallback(async () => {
    try {
      const result = await getFarmMembers(farmId, { page: 1, pageSize: 200 });
      const options = result.items.map((member) => ({
        value: member.user_id,
        label: getMemberDisplayName(member),
      }));
      setMemberOptions(options);
    } catch (error) {
      console.error('Failed to load farm members:', error);
    }
  }, [farmId, getFarmMembers, getMemberDisplayName]);

  // Load pre-selected animal/group details - health records must be created from animal or group context
  const loadAnimalsAndGroups = useCallback(async () => {
    const hasPreSelectedAnimal = !!(initialValues?.animal_id);
    const hasPreSelectedGroup = !!(initialValues?.group_id);

    try {
      // If animal is pre-selected, fetch animal details to show name
      if (hasPreSelectedAnimal && initialValues.animal_id) {
        try {
          const animal = await getAnimalById(farmId, initialValues.animal_id);
          setPreSelectedAnimalName(animal.name || animal.tag_id || animal.id);
        } catch (error) {
          console.error('Failed to load pre-selected animal:', error);
        }
      }

      // If group is pre-selected, fetch group details to show name
      if (hasPreSelectedGroup && initialValues.group_id) {
        try {
          const group = await getGroupById(farmId, initialValues.group_id);
          setPreSelectedGroupName(group.name || initialValues.group_id);
        } catch (error) {
          console.error('Failed to load pre-selected group:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load pre-selected animal/group for health record form:', error);
    }
  }, [farmId, getAnimalById, getGroupById, initialValues]);

  useEffect(() => {
    loadFarmMembers();
  }, [loadFarmMembers]);

  useEffect(() => {
    loadAnimalsAndGroups();
  }, [loadAnimalsAndGroups]);

  // Determine if animal or group is pre-selected (from context)
  const isAnimalPreSelected = useMemo(() => {
    return !!(initialValues?.animal_id);
  }, [initialValues]);

  const isGroupPreSelected = useMemo(() => {
    return !!(initialValues?.group_id);
  }, [initialValues]);

  useEffect(() => {
    if (!initialValues) {
      return;
    }

    setFormValues((prev) => ({
      ...prev,
      animal_id: initialValues.animal_id || '',
      group_id: initialValues.group_id || '',
      record_type: (initialValues.record_type as HealthRecordType) || prev.record_type,
      title: initialValues.title || '',
      description: initialValues.description || '',
      performed_at: initialValues.performed_at ? formatDateForInput(initialValues.performed_at) : getTodayDateString(),
      performed_by: initialValues.performed_by || '',
      vet_name: initialValues.vet_name || '',
      medication: initialValues.medication || '',
      dosage: initialValues.dosage || '',
      withdrawal_period_days:
        typeof initialValues.withdrawal_period_days === 'number'
          ? String(initialValues.withdrawal_period_days)
          : '',
      cost: typeof initialValues.cost === 'number' ? String(initialValues.cost) : '',
      follow_up_date: initialValues.follow_up_date ? formatDateForInput(initialValues.follow_up_date) : '',
      outcome: initialValues.outcome || '',
      health_score:
        typeof initialValues.health_score === 'number'
          ? String(initialValues.health_score)
          : '',
      notes: initialValues.notes || '',
    }));
  }, [initialValues]);

  const handleInputChange = (field: keyof HealthRecordFormValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formValues.record_type) {
      nextErrors.record_type = 'Record type is required';
    }

    if (!formValues.title.trim()) {
      nextErrors.title = 'Title is required';
    }

    if (!formValues.performed_at) {
      nextErrors.performed_at = 'Performed date is required';
    }

    // Health records must be created from animal or group context
    if (!isAnimalPreSelected && !isGroupPreSelected) {
      nextErrors.submit = 'Health records must be created from an animal or group page';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (): CreateHealthRecordRequest | UpdateHealthRecordRequest => {
    const payload: CreateHealthRecordRequest = {
      record_type: formValues.record_type,
      title: formValues.title,
      performed_at: toStartOfDayISOString(formValues.performed_at) ?? formValues.performed_at,
    };

    // Health records must be created from animal or group context (no dropdowns)
    // Use pre-selected animal_id or group_id from initialValues
    if (isAnimalPreSelected && initialValues?.animal_id) {
      payload.animal_id = initialValues.animal_id;
      payload.group_id = null;
    } else if (isGroupPreSelected && initialValues?.group_id) {
      payload.group_id = initialValues.group_id;
      payload.animal_id = null;
    } else {
      // This should not happen if form is accessed correctly
      payload.animal_id = null;
      payload.group_id = null;
    }

    if (formValues.description && formValues.description.trim() !== '') {
      payload.description = formValues.description.trim();
    }

    // Only include performed_by if it's a non-empty string (it should be a UUID)
    // If empty or whitespace, omit it entirely so the backend can auto-set it to the current user
    // Backend validation requires performed_by to be either omitted or a valid UUID4
    const performedBy = formValues.performed_by?.trim();
    if (performedBy && performedBy !== '') {
      payload.performed_by = performedBy;
    }

    // Only include optional string fields if they have non-empty values
    if (formValues.vet_name && formValues.vet_name.trim() !== '') {
      payload.vet_name = formValues.vet_name.trim();
    }

    if (formValues.medication && formValues.medication.trim() !== '') {
      payload.medication = formValues.medication.trim();
    }

    if (formValues.dosage && formValues.dosage.trim() !== '') {
      payload.dosage = formValues.dosage.trim();
    }

    if (formValues.withdrawal_period_days) {
      const value = Number(formValues.withdrawal_period_days);
      if (!Number.isNaN(value)) {
        payload.withdrawal_period_days = value;
      }
    }

    if (formValues.cost) {
      const value = Number(formValues.cost);
      if (!Number.isNaN(value)) {
        payload.cost = value;
      }
    }

    if (formValues.follow_up_date) {
      payload.follow_up_date = toStartOfDayISOString(formValues.follow_up_date) ?? formValues.follow_up_date;
    }

    if (formValues.outcome && formValues.outcome.trim() !== '') {
      payload.outcome = formValues.outcome.trim();
    }

    if (formValues.health_score) {
      const value = Number(formValues.health_score);
      if (!Number.isNaN(value)) {
        payload.health_score = value;
      }
    }

    if (formValues.notes && formValues.notes.trim() !== '') {
      payload.notes = formValues.notes.trim();
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
      const message = error?.error || error?.message || 'Failed to submit health record';
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
            Document treatments, vaccinations, inspections, or other health events for your livestock or groups.
          </p>
        </div>

        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isAnimalPreSelected && (
            <div>
              <Label>Animal</Label>
              <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50">
                {preSelectedAnimalName || 'Loading...'}
              </div>
            </div>
          )}

          {isGroupPreSelected && (
            <div>
              <Label>Group</Label>
              <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50">
                {preSelectedGroupName || 'Loading...'}
              </div>
            </div>
          )}

          <div>
            <Label>Record Type *</Label>
            <select
              value={formValues.record_type}
              onChange={(event) => handleInputChange('record_type', event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              data-testid="health-record-type-select"
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
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-2">
            <Label>Title *</Label>
            <Input
              type="text"
              value={formValues.title}
              onChange={(event) => handleInputChange('title', event.target.value)}
              placeholder="e.g., Annual Vaccination"
              data-testid="health-record-title-input"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
            )}
          </div>

          <div>
            <Label>Performed At *</Label>
            <Input
              type="date"
              value={formValues.performed_at}
              onChange={(event) => handleInputChange('performed_at', event.target.value)}
              data-testid="health-record-performed-at-input"
            />
            {errors.performed_at && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.performed_at}</p>
            )}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Performed By</Label>
            <select
              value={formValues.performed_by ?? ''}
              onChange={(event) => handleInputChange('performed_by', event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              data-testid="health-record-performed-by-select"
            >
              <option value="">Select member (optional)</option>
              {memberOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Vet Name</Label>
            <Input
              type="text"
              value={formValues.vet_name ?? ''}
              onChange={(event) => handleInputChange('vet_name', event.target.value)}
              placeholder="Attending vet"
              data-testid="health-record-vet-name-input"
            />
          </div>
          <div>
            <Label>Medication</Label>
            <Input
              type="text"
              value={formValues.medication ?? ''}
              onChange={(event) => handleInputChange('medication', event.target.value)}
              placeholder="Medication administered"
              data-testid="health-record-medication-input"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Dosage</Label>
            <Input
              type="text"
              value={formValues.dosage ?? ''}
              onChange={(event) => handleInputChange('dosage', event.target.value)}
              placeholder="Dosage details"
              data-testid="health-record-dosage-input"
            />
          </div>
          <div>
            <Label>Withdrawal Period (days)</Label>
            <Input
              type="number"
              value={formValues.withdrawal_period_days ?? ''}
              onChange={(event) => handleInputChange('withdrawal_period_days', event.target.value)}
              placeholder="0"
              data-testid="health-record-withdrawal-input"
            />
          </div>
          <div>
            <Label>Cost</Label>
            <Input
              type="number"
              value={formValues.cost ?? ''}
              onChange={(event) => handleInputChange('cost', event.target.value)}
              placeholder="0.00"
              data-testid="health-record-cost-input"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Follow-up Date</Label>
            <Input
              type="date"
              value={formValues.follow_up_date ?? ''}
              onChange={(event) => handleInputChange('follow_up_date', event.target.value)}
              data-testid="health-record-follow-up-input"
            />
          </div>
          <div>
            <Label>Outcome</Label>
            <Input
              type="text"
              value={formValues.outcome ?? ''}
              onChange={(event) => handleInputChange('outcome', event.target.value)}
              placeholder="Outcome summary"
              data-testid="health-record-outcome-input"
            />
          </div>
          <div>
            <Label>Health Score (0-100)</Label>
            <Input
              type="number"
              value={formValues.health_score ?? ''}
              onChange={(event) => handleInputChange('health_score', event.target.value)}
              min="0"
              max="100"
              data-testid="health-record-health-score-input"
            />
          </div>
        </div>

        <div>
          <Label>Description</Label>
          <textarea
            value={formValues.description ?? ''}
            onChange={(event) => handleInputChange('description', event.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Details about this health event"
            data-testid="health-record-description-textarea"
          />
        </div>

        <div>
          <Label>Notes</Label>
          <textarea
            value={formValues.notes ?? ''}
            onChange={(event) => handleInputChange('notes', event.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Additional context or next steps"
            data-testid="health-record-notes-textarea"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="cancel-health-record-button">
          {cancelLabel}
        </Button>
        <Button type="submit" disabled={isSubmitting} data-testid="submit-health-record-button">
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
