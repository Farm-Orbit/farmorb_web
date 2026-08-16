"use client";

import { FormEvent, useEffect, useState } from 'react';
import { useCrops } from '@/hooks/useCrops';
import { PlantingService } from '@/services/plantingService';
import Button from '@/components/ui/button/Button';
import { PlantingCycle } from '@/types/crop';
import { activeCycle, cycleLabel } from '@/utils/cropCycles';
import { SaleService } from '@/services/financeService';
import { Sale, SalesChannel } from '@/types/finance';
import { fieldClass, optionClass } from './fieldStyles';

interface Props {
  farmId: string;
}

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
  // A picking session usually splits across grades. Repeatable rows keep
  // that one submission instead of several records and re-navigations.
  const [lines, setLines] = useState([{ quantity: '', grade: '' }]);
  const [unit, setUnit] = useState('kg');
  const [brix, setBrix] = useState('');
  const [fruitWeight, setFruitWeight] = useState('');
  const [destination, setDestination] = useState('');
  const [labourHours, setLabourHours] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // A sale starts from the harvest it came out of, so the quantity can be
  // checked against what was actually picked rather than typed blind.
  const [sales, setSales] = useState<Sale[]>([]);
  const [sellingId, setSellingId] = useState<string | null>(null);
  const [saleQty, setSaleQty] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [saleChannel, setSaleChannel] = useState<SalesChannel>('wholesale');
  const [saleCustomer, setSaleCustomer] = useState('');
  const [saleError, setSaleError] = useState<string | null>(null);

  useEffect(() => {
    loadHarvests(farmId);
    loadPlantings(farmId);
    SaleService.list(farmId).then(setSales).catch(() => setSales([]));
  }, [farmId, loadHarvests, loadPlantings]);

  const soldFor = (harvestId: string) =>
    sales.filter((s) => s.harvest_id === harvestId).reduce((sum, s) => sum + Number(s.quantity), 0);

  useEffect(() => {
    const loadCycles = async () => {
      if (!plantingId) {
        setCycles([]);
        setCycleId('');
        return;
      }
      const list = await PlantingService.listCycles(plantingId);
      setCycles(list);
      setCycleId(activeCycle(list)?.id || '');
    };
    loadCycles().catch(console.error);
  }, [plantingId]);

  const selectedCycle = cycles.find((c) => c.id === cycleId);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const num = (v: string) => (v === '' ? null : Number(v));
    const filled = lines.filter((l) => l.quantity !== '');
    let ok = true;

    for (const line of filled) {
      const result = await addHarvest(farmId, {
        planting_id: plantingId,
        cycle_id: cycleId,
        harvest_date: harvestDate,
        harvest_type: 'partial',
        quantity: Number(line.quantity),
        quantity_unit: unit,
        quality_grade: line.grade || null,
        average_brix: num(brix),
        average_fruit_weight_kg: num(fruitWeight),
        destination: destination || null,
        labor_hours: num(labourHours),
      });
      if (result.meta.requestStatus !== 'fulfilled') ok = false;
    }

    setSubmitting(false);
    if (ok && filled.length > 0) {
      setShowForm(false);
      setLines([{ quantity: '', grade: '' }]);
      setBrix('');
      setFruitWeight('');
      setLabourHours('');
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
            className={fieldClass}
          >
            <option className={optionClass} value="">Select planting</option>
            {plantings.map((p) => (
              <option className={optionClass} key={p.id} value={p.id}>
                {p.planting_date} — {p.crop_types?.name || 'Crop'}
              </option>
            ))}
          </select>
          {/* The cycle follows from the planting — asking for it separately is
              two questions for one fact, in vocabulary nobody uses. It shows as
              a chip, and only becomes editable if there is a real choice. */}
          <div className="flex items-center gap-2 self-center text-sm" data-testid="harvest-cycle-chip">
            <span className="text-gray-500 dark:text-gray-400">Season</span>
            {selectedCycle ? (
              cycles.length > 1 ? (
                <select
                  value={cycleId}
                  onChange={(e) => setCycleId(e.target.value)}
                  className={`${fieldClass} py-1`}
                  aria-label="Season"
                >
                  {cycles.map((c) => (
                    <option className={optionClass} key={c.id} value={c.id}>
                      {cycleLabel(c)}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-800 dark:bg-white/10 dark:text-white/90">
                  {cycleLabel(selectedCycle)}
                </span>
              )
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>
          <input
            required
            type="date"
            value={harvestDate}
            onChange={(e) => setHarvestDate(e.target.value)}
            className={fieldClass}
          />
          <input
            required
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="Unit (kg, crates…)"
            className={fieldClass}
          />

          <div className="space-y-2 sm:col-span-2" data-testid="harvest-lines">
            {lines.map((line, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <input
                  required={i === 0}
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.quantity}
                  onChange={(e) =>
                    setLines((ls) =>
                      ls.map((l, j) => (j === i ? { ...l, quantity: e.target.value } : l))
                    )
                  }
                  placeholder="Quantity"
                  className={fieldClass}
                  data-testid={`harvest-quantity-input-${i}`}
                />
                <select
                  value={line.grade}
                  onChange={(e) =>
                    setLines((ls) =>
                      ls.map((l, j) => (j === i ? { ...l, grade: e.target.value } : l))
                    )
                  }
                  className={fieldClass}
                  data-testid={`harvest-grade-select-${i}`}
                >
                  <option className={optionClass} value="">Grade (optional)</option>
                  {['export_a', 'export_b', 'local_a', 'local_b', 'processing', 'reject'].map((g) => (
                    <option className={optionClass} key={g} value={g}>
                      {g.replace('_', ' ')}
                    </option>
                  ))}
                </select>
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
                    className="text-xs text-gray-500 hover:underline"
                    aria-label="Remove this grade"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLines((ls) => [...ls, { quantity: '', grade: '' }])}
              className="text-xs font-medium text-brand-500 hover:underline"
              data-testid="add-harvest-line"
            >
              Add another grade
            </button>
          </div>

          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              className="text-xs font-medium text-brand-500 hover:underline"
              data-testid="harvest-more-toggle"
            >
              {showMore ? 'Fewer details' : 'Quality and labour'}
            </button>
          </div>

          {showMore && (
            <>
              <input
                type="number"
                min="0"
                step="0.1"
                value={brix}
                onChange={(e) => setBrix(e.target.value)}
                placeholder="Average brix"
                className={fieldClass}
                data-testid="harvest-brix-input"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={fruitWeight}
                onChange={(e) => setFruitWeight(e.target.value)}
                placeholder="Average fruit weight (kg)"
                className={fieldClass}
                data-testid="harvest-fruit-weight-input"
              />
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className={fieldClass}
                data-testid="harvest-destination-select"
              >
                <option className={optionClass} value="">Destination</option>
                {['storage', 'direct_sale', 'processing', 'waste'].map((d) => (
                  <option className={optionClass} key={d} value={d}>{d.replace('_', ' ')}</option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="0.25"
                value={labourHours}
                onChange={(e) => setLabourHours(e.target.value)}
                placeholder="Labour hours"
                className={fieldClass}
                data-testid="harvest-labour-input"
              />
            </>
          )}

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
                <th className="px-4 py-3 font-medium">Season</th>
                <th className="px-4 py-3 font-medium">Quantity</th>
                <th className="px-4 py-3 font-medium">Sold</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {harvests.flatMap((h) => [
                <tr key={h.id}>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{h.harvest_date}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {h.plantings?.crop_types?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {h.planting_cycles ? cycleLabel(h.planting_cycles) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {h.quantity} {h.quantity_unit}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {soldFor(h.id) > 0 ? `${soldFor(h.id)} ${h.quantity_unit}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {Number(h.quantity) - soldFor(h.id) > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSellingId(sellingId === h.id ? null : h.id);
                          setSaleError(null);
                          setSaleQty(String(Number(h.quantity) - soldFor(h.id)));
                        }}
                        className="text-xs font-medium text-brand-500 hover:underline"
                        data-testid={`sell-harvest-${h.id}`}
                      >
                        Sell
                      </button>
                    )}
                  </td>
                </tr>,
                sellingId === h.id && (
                  <tr key={`${h.id}-sale`}>
                    <td colSpan={6} className="bg-gray-50 px-4 py-3 dark:bg-white/[0.02]">
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setSaleError(null);
                          try {
                            await SaleService.create(farmId, {
                              harvest_id: h.id,
                              sale_date: new Date().toISOString().slice(0, 10),
                              channel: saleChannel,
                              customer_name: saleCustomer || null,
                              quantity: Number(saleQty),
                              quantity_unit: h.quantity_unit,
                              unit_price: Number(salePrice),
                            });
                            setSellingId(null);
                            setSalePrice('');
                            setSaleCustomer('');
                            setSales(await SaleService.list(farmId));
                          } catch (err) {
                            setSaleError(err instanceof Error ? err.message : 'Could not record the sale');
                          }
                        }}
                        className="flex flex-wrap items-end gap-2"
                        data-testid="sale-form"
                      >
                        <label className="space-y-1">
                          <span className="block text-xs text-gray-500 dark:text-gray-400">
                            Quantity ({Number(h.quantity) - soldFor(h.id)} {h.quantity_unit} left)
                          </span>
                          <input
                            required
                            type="number"
                            min="0"
                            step="0.001"
                            value={saleQty}
                            onChange={(e) => setSaleQty(e.target.value)}
                            className={fieldClass}
                            data-testid="sale-quantity-input"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="block text-xs text-gray-500 dark:text-gray-400">Price per {h.quantity_unit}</span>
                          <input
                            required
                            type="number"
                            min="0"
                            step="0.0001"
                            value={salePrice}
                            onChange={(e) => setSalePrice(e.target.value)}
                            className={fieldClass}
                            data-testid="sale-price-input"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="block text-xs text-gray-500 dark:text-gray-400">Channel</span>
                          <select
                            value={saleChannel}
                            onChange={(e) => setSaleChannel(e.target.value as SalesChannel)}
                            className={fieldClass}
                            data-testid="sale-channel-select"
                          >
                            {(['export', 'wholesale', 'farm_gate', 'processing', 'other'] as SalesChannel[]).map((c) => (
                              <option className={optionClass} key={c} value={c}>{c.replace('_', ' ')}</option>
                            ))}
                          </select>
                        </label>
                        <label className="space-y-1">
                          <span className="block text-xs text-gray-500 dark:text-gray-400">Customer</span>
                          <input
                            value={saleCustomer}
                            onChange={(e) => setSaleCustomer(e.target.value)}
                            className={fieldClass}
                            data-testid="sale-customer-input"
                          />
                        </label>
                        <Button type="submit" size="sm" data-testid="save-sale-button">Record sale</Button>
                        {saleError && (
                          <p className="w-full text-sm text-red-600 dark:text-red-400" data-testid="sale-error">
                            {saleError}
                          </p>
                        )}
                      </form>
                    </td>
                  </tr>
                ),
              ]).flat().filter(Boolean)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
