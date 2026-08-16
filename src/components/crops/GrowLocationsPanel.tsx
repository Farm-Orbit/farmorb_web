"use client";

import { FormEvent, useEffect, useState } from 'react';
import { useCrops } from '@/hooks/useCrops';
import Button from '@/components/ui/button/Button';
import { LocationStatus, LocationType } from '@/types/crop';
import { fieldClass, optionClass } from './fieldStyles';

interface Props {
  farmId: string;
}

const locationTypes: LocationType[] = [
  'block', 'field', 'bed', 'greenhouse', 'nursery', 'plot', 'section', 'other',
];
const statuses: LocationStatus[] = ['active', 'preparing', 'fallow', 'retired'];

export default function GrowLocationsPanel({ farmId }: Props) {
  const { locations, isLoading, error, loadLocations, addLocation } = useCrops();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [locationType, setLocationType] = useState<LocationType>('field');
  const [sizeHectares, setSizeHectares] = useState('');
  const [parentId, setParentId] = useState('');
  const [status, setStatus] = useState<LocationStatus>('active');
  const [soilType, setSoilType] = useState('');
  const [soilPh, setSoilPh] = useState('');
  const [irrigation, setIrrigation] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [notes, setNotes] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadLocations(farmId);
  }, [farmId, loadLocations]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const num = (v: string) => (v === '' ? undefined : Number(v));
    const result = await addLocation(farmId, {
      name,
      location_type: locationType,
      parent_location_id: parentId || undefined,
      size_hectares: num(sizeHectares),
      gps_latitude: num(lat),
      gps_longitude: num(lng),
      soil_type: soilType || undefined,
      soil_ph: num(soilPh),
      irrigation_type: irrigation || undefined,
      status,
      notes: notes || undefined,
    });
    setSubmitting(false);
    if (result.meta.requestStatus === 'fulfilled') {
      setName('');
      setSizeHectares('');
      setLocationType('field');
      setParentId('');
      setStatus('active');
      setSoilType('');
      setSoilPh('');
      setIrrigation('');
      setLat('');
      setLng('');
      setNotes('');
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
          {/* A block sits inside a field; the hierarchy already exists in the
              schema and is what land plotting will nest by. */}
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className={fieldClass}
            data-testid="location-parent-select"
          >
            <option className={optionClass} value="">No parent location</option>
            {locations
              .filter((l) => l.id !== undefined)
              .map((l) => (
                <option className={optionClass} key={l.id} value={l.id}>{l.name}</option>
              ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as LocationStatus)}
            className={fieldClass}
            data-testid="location-status-select"
          >
            {statuses.map((st) => (
              <option className={optionClass} key={st} value={st}>{st}</option>
            ))}
          </select>

          <div className="sm:col-span-3">
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              className="text-xs font-medium text-brand-500 hover:underline"
              data-testid="location-more-toggle"
            >
              {showMore ? 'Fewer details' : 'Soil, water and position'}
            </button>
          </div>

          {showMore && (
            <>
              <input
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                placeholder="Soil type"
                className={fieldClass}
                data-testid="location-soil-type-input"
              />
              <input
                type="number"
                min="0"
                max="14"
                step="0.1"
                value={soilPh}
                onChange={(e) => setSoilPh(e.target.value)}
                placeholder="Soil pH"
                className={fieldClass}
                data-testid="location-soil-ph-input"
              />
              <input
                value={irrigation}
                onChange={(e) => setIrrigation(e.target.value)}
                placeholder="Irrigation type"
                className={fieldClass}
                data-testid="location-irrigation-input"
              />
              <input
                type="number"
                step="0.00000001"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="Latitude"
                className={fieldClass}
                data-testid="location-lat-input"
              />
              <input
                type="number"
                step="0.00000001"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="Longitude"
                className={fieldClass}
                data-testid="location-lng-input"
              />
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes"
                className={fieldClass}
                data-testid="location-notes-input"
              />
            </>
          )}

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
