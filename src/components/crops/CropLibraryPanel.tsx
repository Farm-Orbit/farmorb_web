"use client";

import { FormEvent, useEffect, useState } from 'react';
import { useCrops } from '@/hooks/useCrops';
import Button from '@/components/ui/button/Button';
import { CreateCropTypeData, GrowingType, CropCategory } from '@/types/crop';
import { fieldClass, optionClass } from './fieldStyles';

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
  const [scientificName, setScientificName] = useState('');
  const [monthsToHarvest, setMonthsToHarvest] = useState('');
  const [rowSpacing, setRowSpacing] = useState('');
  const [plantSpacing, setPlantSpacing] = useState('');
  const [plantsPerHa, setPlantsPerHa] = useState('');
  const [expectedYield, setExpectedYield] = useState('');
  const [supportsRatoon, setSupportsRatoon] = useState(false);
  const [maxRatoons, setMaxRatoons] = useState('');
  // Setup is done once per crop, so thoroughness beats speed — but the
  // agronomy detail still starts collapsed so the common case stays short.
  const [showMore, setShowMore] = useState(false);
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
    const num = (v: string) => (v === '' ? undefined : Number(v));
    const payload: CreateCropTypeData = {
      name,
      growing_type: growingType,
      category: category || undefined,
      scientific_name: scientificName || undefined,
      months_to_first_harvest: num(monthsToHarvest),
      default_spacing_row_meters: num(rowSpacing),
      default_spacing_plant_meters: num(plantSpacing),
      plants_per_hectare: num(plantsPerHa),
      expected_yield_per_hectare: num(expectedYield),
      supports_ratoon: supportsRatoon,
      max_ratoon_cycles: supportsRatoon ? num(maxRatoons) : undefined,
    };
    const result = await addCropType(farmId, payload);
    setSubmitting(false);
    if (result.meta.requestStatus === 'fulfilled') {
      setName('');
      setCategory('');
      setGrowingType('annual');
      setScientificName('');
      setMonthsToHarvest('');
      setRowSpacing('');
      setPlantSpacing('');
      setPlantsPerHa('');
      setExpectedYield('');
      setSupportsRatoon(false);
      setMaxRatoons('');
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
            className={fieldClass}
          />
          <select
            value={growingType}
            onChange={(e) => setGrowingType(e.target.value as GrowingType)}
            className={fieldClass}
          >
            {growingTypes.map((t) => (
              <option className={optionClass} key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CropCategory | '')}
            className={fieldClass}
          >
            <option className={optionClass} value="">Category (optional)</option>
            {categories.map((c) => (
              <option className={optionClass} key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            value={scientificName}
            onChange={(e) => setScientificName(e.target.value)}
            placeholder="Scientific name (optional)"
            data-testid="crop-type-scientific-input"
            className={fieldClass}
          />
          <input
            type="number"
            min="0"
            value={monthsToHarvest}
            onChange={(e) => setMonthsToHarvest(e.target.value)}
            placeholder="Months to first harvest"
            data-testid="crop-type-months-input"
            className={fieldClass}
          />
          <div className="sm:col-span-3">
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              className="text-xs font-medium text-brand-500 hover:underline"
              data-testid="crop-type-more-toggle"
            >
              {showMore ? 'Fewer details' : 'Spacing, yield and ratoon'}
            </button>
          </div>

          {showMore && (
            <>
              <input
                type="number"
                min="0"
                step="0.01"
                value={rowSpacing}
                onChange={(e) => setRowSpacing(e.target.value)}
                placeholder="Row spacing (m)"
                data-testid="crop-type-row-spacing-input"
                className={fieldClass}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={plantSpacing}
                onChange={(e) => setPlantSpacing(e.target.value)}
                placeholder="Plant spacing (m)"
                data-testid="crop-type-plant-spacing-input"
                className={fieldClass}
              />
              <input
                type="number"
                min="0"
                value={plantsPerHa}
                onChange={(e) => setPlantsPerHa(e.target.value)}
                placeholder="Plants per hectare"
                data-testid="crop-type-density-input"
                className={fieldClass}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={expectedYield}
                onChange={(e) => setExpectedYield(e.target.value)}
                placeholder="Expected yield (t/ha)"
                data-testid="crop-type-yield-input"
                className={fieldClass}
              />
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={supportsRatoon}
                  onChange={(e) => setSupportsRatoon(e.target.checked)}
                  data-testid="crop-type-ratoon-checkbox"
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
                />
                Regrows after harvest
              </label>
              {/* Only meaningful for a ratoon crop, so it appears with one. */}
              {supportsRatoon && (
                <input
                  type="number"
                  min="1"
                  value={maxRatoons}
                  onChange={(e) => setMaxRatoons(e.target.value)}
                  placeholder="Max ratoon cycles"
                  data-testid="crop-type-max-ratoons-input"
                  className={fieldClass}
                />
              )}
            </>
          )}

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
                    className={`${fieldClass} flex-1`}
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
