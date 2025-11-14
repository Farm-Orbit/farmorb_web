"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import { Supplier, CreateSupplierRequest, UpdateSupplierRequest } from '@/types/inventory';

export type SupplierFormMode = 'create' | 'edit';

interface SupplierFormProps {
  mode: SupplierFormMode;
  farmId: string;
  initialValues?: Partial<Supplier>;
  onSubmit: (data: CreateSupplierRequest | UpdateSupplierRequest) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
  cancelLabel?: string;
}

interface SupplierFormValues {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

const defaultFormValues: SupplierFormValues = {
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
};

export default function SupplierForm({
  mode,
  farmId,
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = mode === 'edit' ? 'Save Changes' : 'Create Supplier',
  cancelLabel = 'Cancel',
}: SupplierFormProps) {
  const [formValues, setFormValues] = useState<SupplierFormValues>(defaultFormValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const heading = useMemo(
    () => (mode === 'edit' ? 'Edit Supplier' : 'Create Supplier'),
    [mode]
  );

  // Initialize form values
  useEffect(() => {
    if (initialValues) {
      const contactInfo = initialValues.contact_info || {};
      setFormValues({
        name: initialValues.name || '',
        phone: (contactInfo.phone as string) || '',
        email: (contactInfo.email as string) || '',
        address: initialValues.address || '',
        notes: initialValues.notes || '',
      });
    }
  }, [initialValues]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formValues.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formValues.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
      newErrors.email = 'Invalid email format';
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
        const contactInfo: Record<string, any> = {};
        if (formValues.phone.trim()) {
          contactInfo.phone = formValues.phone.trim();
        }
        if (formValues.email.trim()) {
          contactInfo.email = formValues.email.trim();
        }

        const submitData: CreateSupplierRequest | UpdateSupplierRequest = {
          name: formValues.name.trim(),
          contact_info: Object.keys(contactInfo).length > 0 ? contactInfo : undefined,
          address: formValues.address.trim() || null,
          notes: formValues.notes.trim() || null,
        };

        await onSubmit(submitData);
      } catch (error) {
        console.error('Failed to submit supplier:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formValues, validate, onSubmit]
  );

  const handleChange = useCallback((field: keyof SupplierFormValues, value: string) => {
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
          {mode === 'edit' ? 'Update supplier details' : 'Add a new supplier to your farm'}
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
            data-testid="supplier-name-input"
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formValues.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+1 (555) 123-4567"
            data-testid="supplier-phone-input"
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formValues.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="supplier@example.com"
            error={errors.email}
            data-testid="supplier-email-input"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            type="text"
            value={formValues.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Street address, City, State, ZIP"
            data-testid="supplier-address-input"
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
            data-testid="supplier-notes-input"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {cancelLabel}
        </Button>
        <Button type="submit" disabled={isSubmitting} data-testid="supplier-submit-button">
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

