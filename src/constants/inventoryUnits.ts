export interface InventoryUnitOption {
  value: string;
  label: string;
}

export const INVENTORY_UNITS: InventoryUnitOption[] = [
  { value: 'bales', label: 'Bales' },
  { value: 'barrels', label: 'Barrels' },
  { value: 'bunches', label: 'Bunches' },
  { value: 'bushels', label: 'Bushels' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'grams', label: 'Grams' },
  { value: 'head', label: 'Head' },
  { value: 'kilograms', label: 'Kilograms' },
  { value: 'kiloliter', label: 'Kiloliter' },
  { value: 'liter', label: 'Liter' },
  { value: 'milliliter', label: 'Milliliter' },
  { value: 'quantity', label: 'Quantity' },
  { value: 'tonnes', label: 'Tonnes' },
];

export type InventoryUnit = InventoryUnitOption['value'];

export const DEFAULT_INVENTORY_UNIT: InventoryUnit = 'kilograms';

