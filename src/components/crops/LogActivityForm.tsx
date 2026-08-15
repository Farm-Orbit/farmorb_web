"use client";

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/button/Button';
import { ActivityService } from '@/services/activityService';
import { InventoryService } from '@/services/inventoryService';
import { PlantingService } from '@/services/plantingService';
import { ActivityTarget, ActivityType, CreateActivityData, CropActivity } from '@/types/activity';
import { InventoryItem } from '@/types/inventory';
import { Planting } from '@/types/crop';
import { activeCycle } from '@/utils/cropCycles';
import { fieldClass, optionClass } from './fieldStyles';

interface Props {
  farmId: string;
  plantings: Planting[];
  /** Prefilled when logging from a specific block, so context is not re-asked. */
  defaultPlantingId?: string | null;
  /** An earlier activity to copy, with today's date. Most field work repeats. */
  repeatOf?: CropActivity | null;
  /** Every block that activity covered — a batch spanned more than one row. */
  repeatTargetIds?: string[];
  onSaved: (message: string) => void;
  onCancel: () => void;
}

const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: 'spray', label: 'Spray' },
  { value: 'fertilisation', label: 'Fertilising' },
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'pruning', label: 'Pruning' },
  { value: 'induction', label: 'Flower induction' },
  { value: 'thinning', label: 'Thinning' },
  { value: 'bagging', label: 'Bagging' },
  { value: 'weeding', label: 'Weeding' },
  { value: 'land_prep', label: 'Land preparation' },
  { value: 'other', label: 'Other' },
];

/** Only these types consume a product, so only they show product fields. */
const USES_PRODUCT: ActivityType[] = ['spray', 'fertilisation'];

export default function LogActivityForm({
  farmId,
  plantings,
  defaultPlantingId,
  repeatOf,
  repeatTargetIds,
  onSaved,
  onCancel,
}: Props) {
  const [activityType, setActivityType] = useState<ActivityType>(
    repeatOf?.activity_type ?? 'spray'
  );
  const [activityDate, setActivityDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [targetIds, setTargetIds] = useState<string[]>(() => {
    if (defaultPlantingId) return [defaultPlantingId];
    // Repeat covers every block the original did, not just the row clicked.
    if (repeatTargetIds?.length) return repeatTargetIds;
    return repeatOf?.planting_id ? [repeatOf.planting_id] : [];
  });
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [itemId, setItemId] = useState(repeatOf?.inventory_item_id ?? '');
  const [productName, setProductName] = useState(repeatOf?.product_name ?? '');
  const [rate, setRate] = useState(repeatOf?.rate != null ? String(repeatOf.rate) : '');
  const [rateUnit, setRateUnit] = useState(repeatOf?.rate_unit ?? 'l/ha');
  const [phiDays, setPhiDays] = useState(
    repeatOf?.phi_days != null ? String(repeatOf.phi_days) : ''
  );
  const [labourHours, setLabourHours] = useState('');
  const [notes, setNotes] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usesProduct = USES_PRODUCT.includes(activityType);

  useEffect(() => {
    if (!usesProduct) return;
    InventoryService.getInventoryItems(farmId, { page: 1, pageSize: 100 })
      .then((res) => setItems(res.items))
      .catch(() => setItems([]));
  }, [farmId, usesProduct]);

  const selectedItem = items.find((i) => i.id === itemId);

  // The product knows its own rate and interval — pull them rather than
  // asking someone to read the label again.
  const [productTouched, setProductTouched] = useState(false);

  useEffect(() => {
    if (!selectedItem || (repeatOf && !productTouched)) return;
    setProductName(selectedItem.name);
    if (selectedItem.default_rate != null) setRate(String(selectedItem.default_rate));
    if (selectedItem.default_rate_unit) setRateUnit(selectedItem.default_rate_unit);
    if (selectedItem.phi_days != null) setPhiDays(String(selectedItem.phi_days));
  }, [selectedItem, repeatOf, productTouched]);

  const targets: ActivityTarget[] = useMemo(
    () =>
      targetIds
        .map((id) => plantings.find((p) => p.id === id))
        .filter((p): p is Planting => Boolean(p))
        .map((p) => ({
          plantingId: p.id,
          // A planting need not state its area — until it does, the block it
          // sits in is the best available answer, and without one a
          // per-hectare rate cannot produce a quantity at all.
          areaHectares: p.area_hectares ?? p.grow_locations?.size_hectares ?? null,
          label: `${p.crop_types?.name ?? 'Crop'} · ${p.grow_locations?.name ?? 'Block'}`,
        })),
    [targetIds, plantings]
  );

  const totalArea = targets.reduce((sum, t) => sum + (t.areaHectares ?? 0), 0);

  // Rate × area. Nobody should be reaching for a calculator mid-form.
  const computedQuantity =
    rate && totalArea > 0 ? Number((Number(rate) * totalArea).toFixed(2)) : null;

  const stockAfter =
    selectedItem && computedQuantity != null
      ? Number(selectedItem.quantity) - computedQuantity
      : null;

  const toggleTarget = (id: string) => {
    setTargetIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (targets.length === 0) {
      setError('Choose at least one block.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // A cycle per target, resolved rather than asked for.
      const withCycles = await Promise.all(
        targets.map(async (t) => {
          if (!t.plantingId) return t;
          const cycles = await PlantingService.listCycles(t.plantingId);
          return { ...t, cycleId: activeCycle(cycles)?.id ?? null };
        })
      );

      const payload: CreateActivityData = {
        targets: withCycles,
        activity_type: activityType,
        activity_date: activityDate,
        inventory_item_id: itemId || null,
        product_name: productName || null,
        active_ingredient: selectedItem?.active_ingredient ?? null,
        rate: rate ? Number(rate) : null,
        rate_unit: rate ? rateUnit : null,
        quantity: computedQuantity,
        quantity_unit: selectedItem?.unit ?? null,
        phi_days: phiDays ? Number(phiDays) : null,
        rei_hours: selectedItem?.rei_hours ?? null,
        labour_hours: labourHours ? Number(labourHours) : null,
        notes: notes || null,
      };

      await ActivityService.create(farmId, payload);

      // Confirm with the thing the grower actually needs to know next.
      let message = `Logged for ${targets.length} block${targets.length > 1 ? 's' : ''}.`;
      if (activityType === 'spray' && withCycles[0]?.plantingId) {
        const safe = await ActivityService.earliestSafeHarvestDate(withCycles[0].plantingId);
        if (safe) message += ` Earliest harvest: ${safe}.`;
      }
      onSaved(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the activity');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
      data-testid="log-activity-form"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">What did you do?</span>
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value as ActivityType)}
            className={`${fieldClass} w-full`}
            data-testid="activity-type-select"
          >
            {ACTIVITY_TYPES.map((t) => (
              <option className={optionClass} key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">When</span>
          <input
            required
            type="date"
            value={activityDate}
            onChange={(e) => setActivityDate(e.target.value)}
            className={`${fieldClass} w-full`}
            data-testid="activity-date-input"
          />
        </label>
      </div>

      {/* Targets are multi-select because nobody sprays one block. */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Where {totalArea > 0 && `· ${totalArea.toFixed(2)} ha`}
          </span>
          <button
            type="button"
            onClick={() =>
              setTargetIds(targetIds.length === plantings.length ? [] : plantings.map((p) => p.id))
            }
            className="text-xs font-medium text-brand-500 hover:underline"
            data-testid="select-all-targets"
          >
            {targetIds.length === plantings.length ? 'Clear all' : 'Select all'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2" data-testid="activity-targets">
          {plantings.map((p) => {
            const on = targetIds.includes(p.id);
            return (
              <button
                type="button"
                key={p.id}
                onClick={() => toggleTarget(p.id)}
                data-testid={`target-chip-${p.id}`}
                aria-pressed={on}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  on
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-white/[0.05]'
                }`}
              >
                {p.crop_types?.name ?? 'Crop'} · {p.grow_locations?.name ?? 'Block'}
              </button>
            );
          })}
          {plantings.length === 0 && (
            <p className="text-xs text-gray-500">Add a planting first.</p>
          )}
        </div>
      </div>

      {usesProduct && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Product</span>
            <select
              value={itemId}
              onChange={(e) => {
                setProductTouched(true);
                setItemId(e.target.value);
              }}
              className={`${fieldClass} w-full`}
              data-testid="activity-product-select"
            >
              <option className={optionClass} value="">Not from stock</option>
              {items.map((i) => (
                <option className={optionClass} key={i.id} value={i.id}>
                  {i.name} ({i.quantity} {i.unit})
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Rate</span>
              <input
                type="number"
                min="0"
                step="0.0001"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className={`${fieldClass} w-full`}
                data-testid="activity-rate-input"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Unit</span>
              <input
                value={rateUnit}
                onChange={(e) => setRateUnit(e.target.value)}
                className={`${fieldClass} w-full`}
                data-testid="activity-rate-unit-input"
              />
            </label>
          </div>

          {computedQuantity != null && (
            <p
              className="text-xs text-gray-600 sm:col-span-2 dark:text-gray-300"
              data-testid="activity-quantity-hint"
            >
              Uses <strong>{computedQuantity} {selectedItem?.unit ?? ''}</strong> across{' '}
              {targets.length} block{targets.length > 1 ? 's' : ''}
              {stockAfter != null && (
                <>
                  , leaving{' '}
                  <strong className={stockAfter < 0 ? 'text-red-600 dark:text-red-400' : ''}>
                    {stockAfter.toFixed(2)} {selectedItem?.unit}
                  </strong>
                </>
              )}
            </p>
          )}

          {activityType === 'spray' && (
            <label className="space-y-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Pre-harvest interval (days)
              </span>
              <input
                type="number"
                min="0"
                value={phiDays}
                onChange={(e) => setPhiDays(e.target.value)}
                className={`${fieldClass} w-full`}
                data-testid="activity-phi-input"
              />
            </label>
          )}
        </div>
      )}

      {/* Everything else is collapsed — a spray needs many fields, an
          irrigation needs three, and showing all of them teaches people to
          give up on the form. */}
      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="text-xs font-medium text-brand-500 hover:underline"
        data-testid="activity-more-toggle"
      >
        {showMore ? 'Fewer details' : 'More details'}
      </button>

      {showMore && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Labour hours</span>
            <input
              type="number"
              min="0"
              step="0.25"
              value={labourHours}
              onChange={(e) => setLabourHours(e.target.value)}
              className={`${fieldClass} w-full`}
              data-testid="activity-labour-input"
            />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Notes</span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${fieldClass} w-full`}
              data-testid="activity-notes-input"
            />
          </label>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" data-testid="activity-error">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={submitting} data-testid="save-activity-button">
          {submitting ? 'Saving…' : 'Log it'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
