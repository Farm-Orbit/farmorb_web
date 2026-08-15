"use client";

import { FormEvent, useEffect, useState } from 'react';
import { useCrops } from '@/hooks/useCrops';
import Button from '@/components/ui/button/Button';
import { CreateCropTypeData, GrowingType, CropCategory } from '@/types/crop';

interface Props {
  farmId: string;
}

const growingTypes: GrowingType[] = ['annual', 'perennial', 'ratoon', 'biennial'];
const categories: CropCategory[] = [
  'fruit', 'vegetable', 'grain', 'legume', 'root', 'tuber', 'herb', 'spice', 'other',
];

export default function CropLibraryPanel({ farmId }: Props) {
  const {
    cropTypes,
    varieties,
    isLoading,
    error,
    loadCropTypes,
    addCropType,
    loadVarieties,
    addVariety,
  } = useCrops();

  const [showForm, setShowForm] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [growingType, setGrowingType] = useState<GrowingType>('annual');
  const [category, setCategory] = useState<CropCategory | ''>('');
  const [varietyName, setVarietyName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCropTypes(farmId);
  }, [farmId, loadCropTypes]);

  useEffect(() => {
    if (selectedTypeId) {
      loadVarieties(selectedTypeId);
    }
  }, [selectedTypeId, loadVarieties]);

  const handleCreateType = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload: CreateCropTypeData = {
      name,
      growing_type: growingType,
      category: category || undefined,
    };
    const result = await addCropType(farmId, payload);
    setSubmitting(false);
    if (result.meta.requestStatus === 'fulfilled') {
      setName('');
      setCategory('');
      setGrowingType('annual');
      setShowForm(false);
    }
  };

  const handleCreateVariety = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTypeId || !varietyName.trim()) return;
    setSubmitting(true);
    await addVariety(selectedTypeId, { name: varietyName.trim() });
    setVarietyName('');
    setSubmitting(false);
  };

  return (
    <div className="space-y-6" data-testid="crop-library-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Crop library</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage crop types and varieties for this farm.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)} data-testid="add-crop-type-button">
          {showForm ? 'Cancel' : 'Add crop type'}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {showForm && (
        <form onSubmit={handleCreateType} className="grid gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700 sm:grid-cols-3">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Crop name"
            data-testid="crop-type-name-input"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
          <select
            value={growingType}
            onChange={(e) => setGrowingType(e.target.value as GrowingType)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          >
            {growingTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CropCategory | '')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          >
            <option value="">Category (optional)</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="sm:col-span-3">
            <Button type="submit" size="sm" disabled={submitting} data-testid="save-crop-type-button">
              Save crop type
            </Button>
          </div>
        </form>
      )}

      {isLoading && cropTypes.length === 0 ? (
        <p className="text-sm text-gray-500">Loading crop types...</p>
      ) : cropTypes.length === 0 ? (
        <p className="text-sm text-gray-500">No crop types yet. Add your first crop.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
            {cropTypes.map((crop) => (
              <li key={crop.id}>
                <button
                  type="button"
                  onClick={() => setSelectedTypeId(crop.id)}
                  data-testid={`crop-type-${crop.name}`}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    selectedTypeId === crop.id ? 'bg-gray-50 dark:bg-gray-800' : ''
                  }`}
                >
                  <span className="font-medium text-gray-900 dark:text-white">{crop.name}</span>
                  <span className="text-xs text-gray-500">{crop.growing_type}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            {!selectedTypeId ? (
              <p className="text-sm text-gray-500">Select a crop type to manage varieties.</p>
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Varieties</h3>
                <form onSubmit={handleCreateVariety} className="flex gap-2">
                  <input
                    value={varietyName}
                    onChange={(e) => setVarietyName(e.target.value)}
                    placeholder="Variety name"
                    data-testid="variety-name-input"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={submitting || !varietyName.trim()}
                    data-testid="add-variety-button"
                  >
                    Add
                  </Button>
                </form>
                {varieties.length === 0 ? (
                  <p className="text-sm text-gray-500">No varieties yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {varieties.map((v) => (
                      <li key={v.id} className="text-sm text-gray-800 dark:text-gray-200">
                        {v.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
