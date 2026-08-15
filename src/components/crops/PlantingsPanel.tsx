"use client";

import { FormEvent, useEffect, useState } from 'react';
import { useCrops } from '@/hooks/useCrops';
import Button from '@/components/ui/button/Button';
import { fieldClass, optionClass } from './fieldStyles';

interface Props {
  farmId: string;
}

export default function PlantingsPanel({ farmId }: Props) {
  const {
    plantings,
    cropTypes,
    locations,
    varieties,
    isLoading,
    error,
    loadPlantings,
    loadCropTypes,
    loadLocations,
    loadVarieties,
    addPlanting,
  } = useCrops();

  const [showForm, setShowForm] = useState(false);
  const [locationId, setLocationId] = useState('');
  const [cropTypeId, setCropTypeId] = useState('');
  const [varietyId, setVarietyId] = useState('');
  const [plantingDate, setPlantingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [plantCount, setPlantCount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPlantings(farmId);
    loadCropTypes(farmId);
    loadLocations(farmId);
  }, [farmId, loadPlantings, loadCropTypes, loadLocations]);

  useEffect(() => {
    if (cropTypeId) {
      loadVarieties(cropTypeId);
      setVarietyId('');
    }
  }, [cropTypeId, loadVarieties]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await addPlanting(farmId, {
      location_id: locationId,
      crop_type_id: cropTypeId,
      variety_id: varietyId || undefined,
      planting_date: plantingDate,
      plant_count: plantCount ? Number(plantCount) : undefined,
      status: 'planted',
    });
    setSubmitting(false);
    if (result.meta.requestStatus === 'fulfilled') {
      setShowForm(false);
      setPlantCount('');
      await loadPlantings(farmId);
    }
  };

  return (
    <div className="space-y-6" data-testid="plantings-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Plantings</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Record plantings. A mother cycle is created automatically for harvests.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : 'New planting'}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700 sm:grid-cols-2">
          <select
            required
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className={fieldClass}
          >
            <option className={optionClass} value="">Select location</option>
            {locations.map((l) => (
              <option className={optionClass} key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <select
            required
            value={cropTypeId}
            onChange={(e) => setCropTypeId(e.target.value)}
            className={fieldClass}
          >
            <option className={optionClass} value="">Select crop type</option>
            {cropTypes.map((c) => (
              <option className={optionClass} key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={varietyId}
            onChange={(e) => setVarietyId(e.target.value)}
            className={fieldClass}
          >
            <option className={optionClass} value="">Variety (optional)</option>
            {varieties.map((v) => (
              <option className={optionClass} key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
          <input
            required
            type="date"
            value={plantingDate}
            onChange={(e) => setPlantingDate(e.target.value)}
            className={fieldClass}
          />
          <input
            type="number"
            min="0"
            value={plantCount}
            onChange={(e) => setPlantCount(e.target.value)}
            placeholder="Plant count"
            className={fieldClass}
          />
          <div className="sm:col-span-2">
            <Button type="submit" size="sm" disabled={submitting}>Save planting</Button>
          </div>
        </form>
      )}

      {isLoading && plantings.length === 0 ? (
        <p className="text-sm text-gray-500">Loading plantings...</p>
      ) : plantings.length === 0 ? (
        <p className="text-sm text-gray-500">No plantings yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Crop</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {plantings.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{p.planting_date}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {p.crop_types?.name || '—'}
                    {p.crop_varieties?.name ? ` · ${p.crop_varieties.name}` : ''}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {p.grow_locations?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
