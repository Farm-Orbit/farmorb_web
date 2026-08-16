"use client";

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/button/Button';
import { ExpenseService, FinancialsService, SaleService } from '@/services/financeService';
import { PlantingService } from '@/services/plantingService';
import {
  CycleFinancials,
  Expense,
  ExpenseCategory,
  ExpenseCategoryRef,
  PlantingFinancials,
  Sale,
} from '@/types/finance';
import { Planting } from '@/types/crop';
import { cycleLabel } from '@/utils/cropCycles';
import { fieldClass, optionClass } from './fieldStyles';

interface Props {
  farmId: string;
}

const money = (value: number | null | undefined) =>
  value == null ? '—' : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function FinancialsPanel({ farmId }: Props) {
  const [rows, setRows] = useState<PlantingFinancials[]>([]);
  const [cycles, setCycles] = useState<CycleFinancials[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [categories, setCategories] = useState<ExpenseCategoryRef[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<ExpenseCategory>('land');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [plantingId, setPlantingId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fin, cyc, exp, sal, plants, cats] = await Promise.all([
        FinancialsService.byPlanting(farmId),
        FinancialsService.byCycle(farmId),
        ExpenseService.list(farmId),
        SaleService.list(farmId),
        PlantingService.list(farmId),
        ExpenseService.categories(),
      ]);
      setRows(fin);
      setCycles(cyc);
      setExpenses(exp);
      setSales(sal);
      setPlantings(plants);
      setCategories(cats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load financials');
    } finally {
      setIsLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await ExpenseService.create(farmId, {
        expense_date: date,
        category,
        description: description || null,
        amount: Number(amount),
        planting_id: plantingId || null,
      });
      setShowForm(false);
      setAmount('');
      setDescription('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the expense');
    } finally {
      setSaving(false);
    }
  };

  const totals = rows.reduce(
    (acc, r) => ({
      cost: acc.cost + Number(r.total_cost),
      revenue: acc.revenue + Number(r.total_revenue),
      margin: acc.margin + Number(r.margin),
    }),
    { cost: 0, revenue: 0, margin: 0 }
  );

  const cyclesFor = (plantingId: string) =>
    cycles.filter((c) => c.planting_id === plantingId && (c.total_cost > 0 || c.total_revenue > 0));

  return (
    <div className="space-y-8" data-testid="financials-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Money</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            What each block cost, what it earned, and what a kilo cost to produce.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)} data-testid="add-expense-button">
          {showForm ? 'Cancel' : 'Add expense'}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400" data-testid="finance-error">{error}</p>}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-3 rounded-lg border border-gray-200 p-4 sm:grid-cols-2 dark:border-gray-700"
          data-testid="expense-form"
        >
          <p className="text-xs text-gray-500 sm:col-span-2 dark:text-gray-400">
            Only costs with no operational trace need typing — input and labour costs come
            from the activities you log.
          </p>
          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={fieldClass}
            data-testid="expense-date-input"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            className={fieldClass}
            data-testid="expense-category-select"
          >
            {categories.map((c) => (
              <option className={optionClass} key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className={fieldClass}
            data-testid="expense-description-input"
          />
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className={fieldClass}
            data-testid="expense-amount-input"
          />
          <select
            value={plantingId}
            onChange={(e) => setPlantingId(e.target.value)}
            className={fieldClass}
            data-testid="expense-planting-select"
          >
            <option className={optionClass} value="">Whole farm</option>
            {plantings.map((p) => (
              <option className={optionClass} key={p.id} value={p.id}>
                {p.crop_types?.name ?? 'Crop'} · {p.grow_locations?.name ?? 'Block'}
              </option>
            ))}
          </select>
          <div className="sm:col-span-2">
            <Button type="submit" size="sm" disabled={saving} data-testid="save-expense-button">
              {saving ? 'Saving…' : 'Save expense'}
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3" data-testid="finance-totals">
            {[
              { label: 'Cost', value: totals.cost, testId: 'total-cost' },
              { label: 'Revenue', value: totals.revenue, testId: 'total-revenue' },
              { label: 'Margin', value: totals.margin, testId: 'total-margin' },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                data-testid={card.testId}
              >
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {card.label}
                </p>
                <p
                  className={`mt-1 text-xl font-semibold tabular-nums ${
                    card.label === 'Margin' && card.value < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {money(card.value)}
                </p>
              </div>
            ))}
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">By block</h3>
            {rows.length === 0 ? (
              <p className="text-sm text-gray-500" data-testid="financials-empty">
                Nothing costed yet.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    <tr>
                      <th className="px-4 py-2 font-medium">Block</th>
                      <th className="px-4 py-2 font-medium">Cost</th>
                      <th className="px-4 py-2 font-medium">Revenue</th>
                      <th className="px-4 py-2 font-medium">Margin</th>
                      <th className="px-4 py-2 font-medium">Harvested</th>
                      <th className="px-4 py-2 font-medium">Cost / kg</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {rows.map((r) => (
                      <tr key={r.planting_id} data-testid="financials-row">
                        <td className="px-4 py-2 text-gray-900 dark:text-white">
                          {r.crop_name ?? 'Crop'}
                          {/* Season-over-season is the comparison a perennial
                              grower actually makes. */}
                          {cyclesFor(r.planting_id).length > 1 && (
                            <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                              {cyclesFor(r.planting_id)
                                .map((c) => `${cycleLabel(c)}: ${money(Number(c.margin))}`)
                                .join(' · ')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 tabular-nums text-gray-600 dark:text-gray-300">
                          {money(Number(r.total_cost))}
                        </td>
                        <td className="px-4 py-2 tabular-nums text-gray-600 dark:text-gray-300">
                          {money(Number(r.total_revenue))}
                        </td>
                        <td
                          className={`px-4 py-2 tabular-nums font-medium ${
                            Number(r.margin) < 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-900 dark:text-white'
                          }`}
                          data-testid="financials-margin"
                        >
                          {money(Number(r.margin))}
                        </td>
                        <td className="px-4 py-2 tabular-nums text-gray-600 dark:text-gray-300">
                          {Number(r.harvested_kg) > 0 ? `${Number(r.harvested_kg)} kg` : '—'}
                        </td>
                        <td
                          className="px-4 py-2 tabular-nums text-gray-600 dark:text-gray-300"
                          data-testid="financials-cost-per-kg"
                        >
                          {r.cost_per_kg != null ? Number(r.cost_per_kg).toFixed(4) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Expenses</h3>
            {expenses.length === 0 ? (
              <p className="text-sm text-gray-500">No expenses yet.</p>
            ) : (
              <ul className="space-y-2" data-testid="expense-ledger">
                {expenses.map((e) => (
                  <li
                    key={e.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                    data-testid={e.is_derived ? 'expense-derived' : 'expense-manual'}
                  >
                    <span className="text-gray-900 dark:text-white">
                      {e.description || e.category}
                      {/* Where a number came from matters more than the number:
                          an untraceable margin is an unused margin. */}
                      {e.is_derived && e.crop_activities && (
                        <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300">
                          from {e.crop_activities.activity_type} on {e.crop_activities.activity_date}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-3 text-sm">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{e.expense_date}</span>
                      <span className="tabular-nums font-medium text-gray-900 dark:text-white">
                        {money(Number(e.amount))}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Sales</h3>
            {sales.length === 0 ? (
              <p className="text-sm text-gray-500" data-testid="sales-empty">
                No sales yet. Record one from a harvest.
              </p>
            ) : (
              <ul className="space-y-2" data-testid="sales-list">
                {sales.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                  >
                    <span className="text-gray-900 dark:text-white">
                      {s.quantity} {s.quantity_unit} · {s.channel.replace('_', ' ')}
                      {s.customer_name && (
                        <span className="text-gray-600 dark:text-gray-300"> · {s.customer_name}</span>
                      )}
                    </span>
                    <span className="flex items-center gap-3 text-sm">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{s.sale_date}</span>
                      <span className="tabular-nums font-medium text-gray-900 dark:text-white">
                        {money(Number(s.total_amount))}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
