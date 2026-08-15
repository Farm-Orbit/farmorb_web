"use client";

import { FormEvent, useEffect, useState } from 'react';
import { useCrops } from '@/hooks/useCrops';
import Button from '@/components/ui/button/Button';
import { LocationType } from '@/types/crop';
import { fieldClass, optionClass } from './fieldStyles';

interface Props {
  farmId: string;
}

const locationTypes: LocationType[] = [
  'block', 'field', 'bed', 'greenhouse', 'nursery', 'plot', 'section', 'other',
];

export default function GrowLocationsPanel({ farmId }: Props) {
  const { locations, isLoading, error, loadLocations, addLocation } = useCrops();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [locationType, setLocationType] = useState<LocationType>('field');
  const [sizeHectares, setSizeHectares] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadLocations(farmId);
  }, [farmId, loadLocations]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await addLocation(farmId, {
      name,
      location_type: locationType,
      size_hectares: sizeHectares ? Number(sizeHectares) : undefined,
    });
    setSubmitting(false);
    if (result.meta.requestStatus === 'fulfilled') {
      setName('');
      setSizeHectares('');
      setLocationType('field');
      setShowForm(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="grow-locations-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Grow locations</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Fields, beds, and blocks where crops are planted.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : 'Add location'}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700 sm:grid-cols-3">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Location name"
            className={fieldClass}
          />
          <select
            value={locationType}
            onChange={(e) => setLocationType(e.target.value as LocationType)}
            className={fieldClass}
          >
            {locationTypes.map((t) => (
              <option className={optionClass} key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            step="0.01"
            value={sizeHectares}
            onChange={(e) => setSizeHectares(e.target.value)}
            placeholder="Size (ha)"
            className={fieldClass}
          />
          <div className="sm:col-span-3">
            <Button type="submit" size="sm" disabled={submitting}>Save location</Button>
          </div>
        </form>
      )}

      {isLoading && locations.length === 0 ? (
        <p className="text-sm text-gray-500">Loading locations...</p>
      ) : locations.length === 0 ? (
        <p className="text-sm text-gray-500">No locations yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Size (ha)</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {locations.map((loc) => (
                <tr key={loc.id}>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{loc.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{loc.location_type}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{loc.size_hectares ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{loc.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
