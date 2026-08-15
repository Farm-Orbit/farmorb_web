"use client";

import { FormEvent, useEffect, useState } from 'react';
import { useCrops } from '@/hooks/useCrops';
import { PlantingService } from '@/services/plantingService';
import Button from '@/components/ui/button/Button';
import { HarvestType, PlantingCycle } from '@/types/crop';

interface Props {
  farmId: string;
}

const harvestTypes: HarvestType[] = [
  'mother', 'ratoon_1', 'ratoon_2', 'ratoon_3', 'ratoon_4', 'partial', 'final',
];

export default function HarvestsPanel({ farmId }: Props) {
  const {
    harvests,
    plantings,
    isLoading,
    error,
    loadHarvests,
    loadPlantings,
    addHarvest,
  } = useCrops();

  const [showForm, setShowForm] = useState(false);
  const [plantingId, setPlantingId] = useState('');
  const [cycleId, setCycleId] = useState('');
  const [cycles, setCycles] = useState<PlantingCycle[]>([]);
  const [harvestDate, setHarvestDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [harvestType, setHarvestType] = useState<HarvestType>('mother');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadHarvests(farmId);
    loadPlantings(farmId);
  }, [farmId, loadHarvests, loadPlantings]);

  useEffect(() => {
    const loadCycles = async () => {
      if (!plantingId) {
        setCycles([]);
        setCycleId('');
        return;
      }
      const list = await PlantingService.listCycles(plantingId);
      setCycles(list);
      const active = list.find((c) => c.status === 'active') || list[0];
      setCycleId(active?.id || '');
    };
    loadCycles().catch(console.error);
  }, [plantingId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await addHarvest(farmId, {
      planting_id: plantingId,
      cycle_id: cycleId,
      harvest_date: harvestDate,
      harvest_type: harvestType,
      quantity: Number(quantity),
      quantity_unit: unit,
    });
    setSubmitting(false);
    if (result.meta.requestStatus === 'fulfilled') {
      setShowForm(false);
      setQuantity('');
      await loadHarvests(farmId);
    }
  };

  return (
    <div className="space-y-6" data-testid="harvests-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Harvests</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Record yield against a planting cycle.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : 'Record harvest'}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700 sm:grid-cols-2">
          <select
            required
            value={plantingId}
            onChange={(e) => setPlantingId(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          >
            <option value="">Select planting</option>
            {plantings.map((p) => (
              <option key={p.id} value={p.id}>
                {p.planting_date} — {p.crop_types?.name || 'Crop'}
              </option>
            ))}
          </select>
          <select
            required
            value={cycleId}
            onChange={(e) => setCycleId(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          >
            <option value="">Select cycle</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.cycle_number} {c.cycle_type} ({c.status})
              </option>
            ))}
          </select>
          <input
            required
            type="date"
            value={harvestDate}
            onChange={(e) => setHarvestDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
          <select
            value={harvestType}
            onChange={(e) => setHarvestType(e.target.value as HarvestType)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          >
            {harvestTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Quantity"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
          <input
            required
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="Unit (kg, crates…)"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
          <div className="sm:col-span-2">
            <Button type="submit" size="sm" disabled={submitting || !cycleId}>
              Save harvest
            </Button>
          </div>
        </form>
      )}

      {isLoading && harvests.length === 0 ? (
        <p className="text-sm text-gray-500">Loading harvests...</p>
      ) : harvests.length === 0 ? (
        <p className="text-sm text-gray-500">No harvests yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Crop</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {harvests.map((h) => (
                <tr key={h.id}>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{h.harvest_date}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {h.plantings?.crop_types?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{h.harvest_type}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {h.quantity} {h.quantity_unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
