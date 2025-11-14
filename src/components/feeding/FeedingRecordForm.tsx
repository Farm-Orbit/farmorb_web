"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import Button from '@/components/ui/button/Button';
import { useAnimals } from '@/hooks/useAnimals';
import { useGroups } from '@/hooks/useGroups';
import { useInventory } from '@/hooks/useInventory';
import {
  CreateFeedingRecordRequest,
  FeedingRecord,
  UpdateFeedingRecordRequest,
} from '@/types/feeding';
import { getTodayDateString, formatDateForInput } from '@/utils/dateUtils';
import { INVENTORY_UNITS, DEFAULT_INVENTORY_UNIT } from '@/constants/inventoryUnits';

export type FeedingRecordFormMode = 'create' | 'edit';

interface FeedingRecordFormProps {
  mode: FeedingRecordFormMode;
  farmId: string;
  initialValues?: Partial<FeedingRecord>;
  onSubmit: (data: CreateFeedingRecordRequest | UpdateFeedingRecordRequest) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
  cancelLabel?: string;
}

interface FeedingRecordFormValues {
  animal_id?: string;
  group_id?: string;
  inventory_item_id?: string;
  feed_type: string;
  amount: string;
  unit: string;
  date: string;
  cost?: string;
  notes?: string;
}

const defaultFormValues: FeedingRecordFormValues = {
  animal_id: '',
  group_id: '',
  inventory_item_id: '',
  feed_type: '',
  amount: '',
  unit: DEFAULT_INVENTORY_UNIT,
  date: getTodayDateString(),
  cost: '',
  notes: '',
};

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

export default function FeedingRecordForm({
  mode,
  farmId,
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = mode === 'edit' ? 'Save Changes' : 'Create Feeding Record',
  cancelLabel = 'Cancel',
}: FeedingRecordFormProps) {
  const { getAnimalById } = useAnimals();
  const { getGroupById } = useGroups();
  const { getInventoryItems } = useInventory();

  const [formValues, setFormValues] = useState<FeedingRecordFormValues>(defaultFormValues);
  const [preSelectedAnimalName, setPreSelectedAnimalName] = useState<string>('');
  const [preSelectedGroupName, setPreSelectedGroupName] = useState<string>('');
  const [inventoryItemOptions, setInventoryItemOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const heading = useMemo(
    () => (mode === 'edit' ? 'Edit Feeding Record' : 'Record Feeding Event'),
    [mode]
  );

  const isAnimalPreSelected = useMemo(() => !!initialValues?.animal_id, [initialValues?.animal_id]);
  const isGroupPreSelected = useMemo(() => !!initialValues?.group_id, [initialValues?.group_id]);

  // Load inventory items for the inventory_item_id dropdown
  const loadInventoryItems = useCallback(async () => {
    try {
      const result = await getInventoryItems(farmId, { page: 1, pageSize: 200 });
      const options = result.items
        .filter((item) => item.category === 'feed') // Only show feed items
        .map((item) => ({
          value: item.id,
          label: `${item.name} (${item.quantity} ${item.unit})`,
        }));
      // Inventory item is required, so don't include "No Inventory Item" option
      setInventoryItemOptions(options);
    } catch (error) {
      console.error('Failed to load inventory items:', error);
    }
  }, [farmId, getInventoryItems]);

  // Load pre-selected animal/group details
  const loadAnimalsAndGroups = useCallback(async () => {
    if (isAnimalPreSelected && initialValues?.animal_id) {
      try {
        const animal = await getAnimalById(farmId, initialValues.animal_id);
        setPreSelectedAnimalName(animal.name || animal.tag_id || 'Unknown Animal');
      } catch (error) {
        console.error('Failed to load animal:', error);
        setPreSelectedAnimalName('Unknown Animal');
      }
    }

    if (isGroupPreSelected && initialValues?.group_id) {
      try {
        const group = await getGroupById(farmId, initialValues.group_id);
        setPreSelectedGroupName(group.name || 'Unknown Group');
      } catch (error) {
        console.error('Failed to load group:', error);
        setPreSelectedGroupName('Unknown Group');
      }
    }
  }, [farmId, initialValues, isAnimalPreSelected, isGroupPreSelected, getAnimalById, getGroupById]);

  useEffect(() => {
    loadInventoryItems();
    loadAnimalsAndGroups();
  }, [loadInventoryItems, loadAnimalsAndGroups]);

  // Initialize form values from initialValues prop
  useEffect(() => {
    if (!initialValues) {
      return;
    }

    setFormValues((prev) => ({
      ...prev,
      animal_id: initialValues.animal_id || '',
      group_id: initialValues.group_id || '',
      inventory_item_id: initialValues.inventory_item_id || '',
      feed_type: initialValues.feed_type || '',
      amount: initialValues.amount ? String(initialValues.amount) : '',
      unit: initialValues.unit || DEFAULT_INVENTORY_UNIT,
      date: initialValues.date ? formatDateForInput(initialValues.date) : getTodayDateString(),
      cost: typeof initialValues.cost === 'number' ? String(initialValues.cost) : '',
      notes: initialValues.notes || '',
    }));
  }, [initialValues]);

  const handleInputChange = (field: keyof FeedingRecordFormValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    // Either animal_id or group_id must be provided (only check in create mode)
    // In edit mode, the record already exists and has these values
    if (mode === 'create' && !isAnimalPreSelected && !isGroupPreSelected) {
      nextErrors.submit = 'Feeding records must be created from an animal or group page';
    }

    if (!formValues.feed_type.trim()) {
      nextErrors.feed_type = 'Feed type is required';
    }

    const amount = parseFloat(formValues.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      nextErrors.amount = 'Amount must be a positive number';
    }

    if (!formValues.unit) {
      nextErrors.unit = 'Unit is required';
    }

    if (!formValues.date) {
      nextErrors.date = 'Date is required';
    }

    // Inventory item is required
    if (!formValues.inventory_item_id || (typeof formValues.inventory_item_id === 'string' && formValues.inventory_item_id.trim() === '')) {
      nextErrors.inventory_item_id = 'Inventory item is required';
    }

    if (formValues.cost && Number.isNaN(parseFloat(formValues.cost))) {
      nextErrors.cost = 'Cost must be a number';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (): CreateFeedingRecordRequest | UpdateFeedingRecordRequest => {
    const payload: CreateFeedingRecordRequest = {
      feed_type: formValues.feed_type.trim(),
      amount: parseFloat(formValues.amount),
      unit: formValues.unit,
      date: toStartOfDayISOString(formValues.date) ?? formValues.date,
    };

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

    // Inventory item is required
    payload.inventory_item_id = formValues.inventory_item_id || null;

    // Only include cost if it's provided
    if (formValues.cost && formValues.cost.trim() !== '') {
      const costValue = parseFloat(formValues.cost);
      if (!Number.isNaN(costValue)) {
        payload.cost = costValue;
      }
    }

    // Note: performed_by is set by the backend automatically from the authenticated user
    // We don't include it in the request payload

    // Only include notes if it has a non-empty value
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
      const message = error?.error || error?.message || 'Failed to submit feeding record';
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
            Record feeding events for your livestock or groups.
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
            <Label htmlFor="feed_type" required>
              Feed Type
            </Label>
            <Input
              id="feed_type"
              type="text"
              value={formValues.feed_type}
              onChange={(event) => handleInputChange('feed_type', event.target.value)}
              placeholder="e.g., Hay, Grain, Concentrate"
              error={errors.feed_type}
              data-testid="feeding-feed-type-input"
            />
          </div>

          <div>
            <Label htmlFor="amount" required>
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              value={formValues.amount}
              onChange={(event) => handleInputChange('amount', event.target.value)}
              placeholder="e.g., 100"
              error={errors.amount}
              data-testid="feeding-amount-input"
              min="0.01"
              step="any"
            />
          </div>

          <div>
            <Label htmlFor="unit" required>
              Unit
            </Label>
            <Select
              id="unit"
              value={formValues.unit}
              onChange={(value) => handleInputChange('unit', value)}
              options={INVENTORY_UNITS}
              placeholder="Select unit"
              data-testid="feeding-unit-select"
            />
            {errors.unit && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.unit}</p>
            )}
          </div>

          <div>
            <Label htmlFor="date" required>
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={formValues.date}
              onChange={(event) => handleInputChange('date', event.target.value)}
              error={errors.date}
              data-testid="feeding-date-input"
            />
          </div>

          <div>
            <Label htmlFor="inventory_item_id" required>
              Inventory Item
            </Label>
            <Select
              id="inventory_item_id"
              value={formValues.inventory_item_id || ''}
              onChange={(value) => handleInputChange('inventory_item_id', value)}
              options={inventoryItemOptions}
              placeholder="Select inventory item"
              data-testid="feeding-inventory-item-select"
            />
            {errors.inventory_item_id && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.inventory_item_id}</p>
            )}
          </div>

          <div>
            <Label htmlFor="cost">Cost</Label>
            <Input
              id="cost"
              type="number"
              value={formValues.cost || ''}
              onChange={(event) => handleInputChange('cost', event.target.value)}
              placeholder="e.g., 50.00"
              error={errors.cost}
              data-testid="feeding-cost-input"
              min="0"
              step="any"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              rows={3}
              value={formValues.notes || ''}
              onChange={(event) => handleInputChange('notes', event.target.value)}
              placeholder="Add any additional notes about this feeding event"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              data-testid="feeding-notes-textarea"
            ></textarea>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {cancelLabel}
        </Button>
        <Button type="submit" disabled={isSubmitting} data-testid="feeding-submit-button">
          {isSubmitting ? (submitLabel ? `${submitLabel}...` : 'Saving...') : submitLabel ?? 'Save Feeding Record'}
        </Button>
      </div>
    </form>
  );
}

