"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import Button from '@/components/ui/button/Button';
import { useInventory } from '@/hooks/useInventory';
import {
  CreateInventoryTransactionRequest,
  TransactionType,
  InventoryItem,
} from '@/types/inventory';

interface InventoryTransactionFormProps {
  farmId: string;
  inventoryItem: InventoryItem;
  onSubmit: (data: CreateInventoryTransactionRequest) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  defaultTransactionType?: TransactionType;
}

interface TransactionFormValues {
  transaction_type: TransactionType;
  quantity: string;
  cost: string;
  supplier_id: string;
  notes: string;
}

const transactionTypeOptions: { value: TransactionType; label: string }[] = [
  { value: 'purchase', label: 'Purchase' },
  { value: 'restock', label: 'Restock' },
  { value: 'usage', label: 'Usage' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'loss', label: 'Loss' },
];

const defaultFormValues: TransactionFormValues = {
  transaction_type: 'restock',
  quantity: '',
  cost: '',
  supplier_id: '',
  notes: '',
};

export default function InventoryTransactionForm({
  farmId,
  inventoryItem,
  onSubmit,
  onCancel,
  submitLabel = 'Create Transaction',
  cancelLabel = 'Cancel',
  defaultTransactionType = 'restock',
}: InventoryTransactionFormProps) {
  const { getSuppliers } = useInventory();

  const [formValues, setFormValues] = useState<TransactionFormValues>({
    ...defaultFormValues,
    transaction_type: defaultTransactionType,
  });
  const [supplierOptions, setSupplierOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load suppliers
  useEffect(() => {
    const loadData = async () => {
      try {
        const suppliersResult = await getSuppliers(farmId, { page: 1, pageSize: 200 });

        const supplierOpts = suppliersResult.items.map((supplier) => ({
          value: supplier.id,
          label: supplier.name,
        }));
        setSupplierOptions([{ value: '', label: 'No Supplier' }, ...supplierOpts]);
      } catch (error) {
        console.error('Failed to load suppliers:', error);
      }
    };

    loadData();
  }, [farmId, getSuppliers]);

  // Set default supplier if item has one
  useEffect(() => {
    if (inventoryItem.supplier_id && !formValues.supplier_id) {
      setFormValues((prev) => ({ ...prev, supplier_id: inventoryItem.supplier_id || '' }));
    }
  }, [inventoryItem.supplier_id, formValues.supplier_id]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formValues.quantity.trim()) {
      newErrors.quantity = 'Quantity is required';
    } else {
      const quantity = parseFloat(formValues.quantity);
      if (Number.isNaN(quantity) || quantity <= 0) {
        newErrors.quantity = 'Quantity must be a valid number greater than 0';
      }
    }

    if (formValues.cost.trim()) {
      const cost = parseFloat(formValues.cost);
      if (Number.isNaN(cost) || cost < 0) {
        newErrors.cost = 'Cost must be a valid number >= 0';
      }
    }

    // Validate that usage/loss/adjustment don't exceed available quantity
    if (formValues.transaction_type === 'usage' || formValues.transaction_type === 'loss') {
      const quantity = parseFloat(formValues.quantity);
      if (!Number.isNaN(quantity) && quantity > inventoryItem.quantity) {
        newErrors.quantity = `Cannot ${formValues.transaction_type} more than available quantity (${inventoryItem.quantity} ${inventoryItem.unit})`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formValues, inventoryItem]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!validate()) {
        return;
      }

      setIsSubmitting(true);
      try {
        const submitData: CreateInventoryTransactionRequest = {
          inventory_item_id: inventoryItem.id,
          transaction_type: formValues.transaction_type,
          quantity: parseFloat(formValues.quantity),
          cost: formValues.cost.trim() ? parseFloat(formValues.cost) : null,
          supplier_id: formValues.supplier_id || null,
          notes: formValues.notes.trim() || null,
        };

        await onSubmit(submitData);
      } catch (error) {
        console.error('Failed to submit transaction:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formValues, inventoryItem, validate, onSubmit]
  );

  const handleChange = useCallback((field: keyof TransactionFormValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const transactionTypeLabel = useMemo(() => {
    return transactionTypeOptions.find((opt) => opt.value === formValues.transaction_type)?.label || formValues.transaction_type;
  }, [formValues.transaction_type]);

  const showSupplierField = useMemo(() => {
    return formValues.transaction_type === 'purchase' || formValues.transaction_type === 'restock';
  }, [formValues.transaction_type]);

  const showCostField = useMemo(() => {
    return formValues.transaction_type === 'purchase' || formValues.transaction_type === 'restock';
  }, [formValues.transaction_type]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Transaction</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Record a transaction for <strong>{inventoryItem.name}</strong> (Current: {inventoryItem.quantity} {inventoryItem.unit})
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="transaction_type" required>
            Transaction Type
          </Label>
          <Select
            id="transaction_type"
            value={formValues.transaction_type}
            onChange={(value) => handleChange('transaction_type', value)}
            options={transactionTypeOptions}
            data-testid="transaction-type-select"
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
            placeholder={`Enter quantity in ${inventoryItem.unit}`}
            error={errors.quantity}
            data-testid="transaction-quantity-input"
          />
          {formValues.transaction_type === 'usage' || formValues.transaction_type === 'loss' ? (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Available: {inventoryItem.quantity} {inventoryItem.unit}
            </p>
          ) : null}
        </div>

        {showCostField && (
          <div>
            <Label htmlFor="cost">Cost</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              min="0"
              value={formValues.cost}
              onChange={(e) => handleChange('cost', e.target.value)}
              placeholder="0.00"
              error={errors.cost}
              data-testid="transaction-cost-input"
            />
          </div>
        )}

        {showSupplierField && (
          <div>
            <Label htmlFor="supplier_id">Supplier</Label>
            <Select
              id="supplier_id"
              value={formValues.supplier_id}
              onChange={(value) => handleChange('supplier_id', value)}
              options={supplierOptions}
              data-testid="transaction-supplier-select"
            />
          </div>
        )}

        <div className="sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            rows={3}
            value={formValues.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Optional notes about this transaction"
            data-testid="transaction-notes-input"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {cancelLabel}
        </Button>
        <Button type="submit" disabled={isSubmitting} data-testid="transaction-submit-button">
          {isSubmitting ? 'Creating...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

