"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import Button from '@/components/ui/button/Button';
import { useInventory } from '@/hooks/useInventory';
import {
  CreateInventoryItemRequest,
  InventoryItem,
  InventoryCategory,
  UpdateInventoryItemRequest,
} from '@/types/inventory';
import { INVENTORY_UNITS, DEFAULT_INVENTORY_UNIT } from '@/constants/inventoryUnits';
import { getTodayDateString, formatDateForInput } from '@/utils/dateUtils';

export type InventoryItemFormMode = 'create' | 'edit';

interface InventoryItemFormProps {
  mode: InventoryItemFormMode;
  farmId: string;
  initialValues?: Partial<InventoryItem>;
  onSubmit: (data: CreateInventoryItemRequest | UpdateInventoryItemRequest) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
  cancelLabel?: string;
}

interface InventoryItemFormValues {
  name: string;
  category: InventoryCategory;
  quantity: string;
  unit: string;
  cost_per_unit: string;
  supplier_id: string;
  expiry_date: string;
  low_stock_threshold: string;
  notes: string;
}

const defaultFormValues: InventoryItemFormValues = {
  name: '',
  category: 'feed',
  quantity: '',
  unit: DEFAULT_INVENTORY_UNIT,
  cost_per_unit: '',
  supplier_id: '',
  expiry_date: getTodayDateString(),
  low_stock_threshold: '',
  notes: '',
};

const categoryOptions: { value: InventoryCategory; label: string }[] = [
  { value: 'feed', label: 'Feed' },
  { value: 'medication', label: 'Medication' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'other', label: 'Other' },
];


export default function InventoryItemForm({
  mode,
  farmId,
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = mode === 'edit' ? 'Save Changes' : 'Create Item',
  cancelLabel = 'Cancel',
}: InventoryItemFormProps) {
  const { getSuppliers } = useInventory();

  const [formValues, setFormValues] = useState<InventoryItemFormValues>(defaultFormValues);
  const [supplierOptions, setSupplierOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const heading = useMemo(
    () => (mode === 'edit' ? 'Edit Inventory Item' : 'Create Inventory Item'),
    [mode]
  );

  // Load suppliers for the dropdown
  const loadSuppliers = useCallback(async () => {
    try {
      const result = await getSuppliers(farmId, { page: 1, pageSize: 200 });
      const options = result.items.map((supplier) => ({
        value: supplier.id,
        label: supplier.name,
      }));
      setSupplierOptions([{ value: '', label: 'No Supplier' }, ...options]);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    }
  }, [farmId, getSuppliers]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  // Initialize form values
  useEffect(() => {
    if (initialValues) {
      setFormValues({
        name: initialValues.name || '',
        category: initialValues.category || 'feed',
        quantity: initialValues.quantity?.toString() || '',
        unit: initialValues.unit || DEFAULT_INVENTORY_UNIT,
        cost_per_unit: initialValues.cost_per_unit?.toString() || '',
        supplier_id: initialValues.supplier_id || '',
        expiry_date: initialValues.expiry_date ? formatDateForInput(initialValues.expiry_date) : getTodayDateString(),
        low_stock_threshold: initialValues.low_stock_threshold?.toString() || '',
        notes: initialValues.notes || '',
      });
    }
  }, [initialValues]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formValues.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formValues.quantity.trim()) {
      newErrors.quantity = 'Quantity is required';
    } else {
      const quantity = parseFloat(formValues.quantity);
      if (Number.isNaN(quantity) || quantity < 0) {
        newErrors.quantity = 'Quantity must be a valid number >= 0';
      }
    }

    if (!formValues.unit) {
      newErrors.unit = 'Unit is required';
    }

    if (formValues.cost_per_unit.trim()) {
      const cost = parseFloat(formValues.cost_per_unit);
      if (Number.isNaN(cost) || cost < 0) {
        newErrors.cost_per_unit = 'Cost per unit must be a valid number >= 0';
      }
    }

    if (formValues.low_stock_threshold.trim()) {
      const threshold = parseFloat(formValues.low_stock_threshold);
      if (Number.isNaN(threshold) || threshold < 0) {
        newErrors.low_stock_threshold = 'Low stock threshold must be a valid number >= 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formValues]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!validate()) {
        return;
      }

      setIsSubmitting(true);
      try {
        const submitData: CreateInventoryItemRequest | UpdateInventoryItemRequest = {
          name: formValues.name.trim(),
          category: formValues.category,
          quantity: parseFloat(formValues.quantity),
          unit: formValues.unit.trim(),
          cost_per_unit: formValues.cost_per_unit.trim()
            ? parseFloat(formValues.cost_per_unit)
            : null,
          supplier_id: formValues.supplier_id || null,
          expiry_date: formValues.expiry_date ? new Date(formValues.expiry_date).toISOString() : null,
          low_stock_threshold: formValues.low_stock_threshold.trim()
            ? parseFloat(formValues.low_stock_threshold)
            : null,
          notes: formValues.notes.trim() || null,
        };

        await onSubmit(submitData);
      } catch (error) {
        console.error('Failed to submit inventory item:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formValues, validate, onSubmit]
  );

  const handleChange = useCallback((field: keyof InventoryItemFormValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{heading}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {mode === 'edit' ? 'Update inventory item details' : 'Add a new item to your inventory'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name" required>
            Name
          </Label>
          <Input
            id="name"
            type="text"
            value={formValues.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            data-testid="inventory-item-name-input"
          />
        </div>

        <div>
          <Label htmlFor="category" required>
            Category
          </Label>
          <Select
            id="category"
            value={formValues.category}
            onChange={(value) => handleChange('category', value)}
            options={categoryOptions}
            data-testid="inventory-item-category-select"
          />
        </div>

        <div>
          <Label htmlFor="quantity" required>
            Quantity
          </Label>
          <Input
            id="quantity"
            type="number"
            step="0.01"
            min="0"
            value={formValues.quantity}
            onChange={(e) => handleChange('quantity', e.target.value)}
            error={errors.quantity}
            data-testid="inventory-item-quantity-input"
          />
        </div>

        <div>
          <Label htmlFor="unit" required>
            Unit
          </Label>
          <Select
            id="unit"
            value={formValues.unit}
            onChange={(value) => handleChange('unit', value)}
            options={INVENTORY_UNITS}
            data-testid="inventory-item-unit-select"
          />
        </div>

        <div>
          <Label htmlFor="cost_per_unit">Cost per Unit</Label>
          <Input
            id="cost_per_unit"
            type="number"
            step="0.01"
            min="0"
            value={formValues.cost_per_unit}
            onChange={(e) => handleChange('cost_per_unit', e.target.value)}
            error={errors.cost_per_unit}
            data-testid="inventory-item-cost-input"
          />
        </div>

        <div>
          <Label htmlFor="supplier_id">Supplier</Label>
          <Select
            id="supplier_id"
            value={formValues.supplier_id}
            onChange={(value) => handleChange('supplier_id', value)}
            options={supplierOptions}
            data-testid="inventory-item-supplier-select"
          />
        </div>

        <div>
          <Label htmlFor="expiry_date">Expiry Date</Label>
          <Input
            id="expiry_date"
            type="date"
            value={formValues.expiry_date}
            onChange={(e) => handleChange('expiry_date', e.target.value)}
            data-testid="inventory-item-expiry-input"
          />
        </div>

        <div>
          <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
          <Input
            id="low_stock_threshold"
            type="number"
            step="0.01"
            min="0"
            value={formValues.low_stock_threshold}
            onChange={(e) => handleChange('low_stock_threshold', e.target.value)}
            error={errors.low_stock_threshold}
            data-testid="inventory-item-threshold-input"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            rows={4}
            value={formValues.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            data-testid="inventory-item-notes-input"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {cancelLabel}
        </Button>
        <Button type="submit" disabled={isSubmitting} data-testid="inventory-item-submit-button">
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

