"use client";

import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/button/Button';
import { PlantingService } from '@/services/plantingService';
import { HarvestService } from '@/services/harvestService';
import { Planting, PlantingCycle } from '@/types/crop';
import { canStartNextCycle, cycleLabel, nextCycleLabel } from '@/utils/cropCycles';

interface Props {
  planting: Planting;
  onCycleStarted?: () => void;
}

interface CycleRow extends PlantingCycle {
  harvested: number;
  unit: string | null;
}

/**
 * The bearing history of one planting. For a mango this is the record that
 * matters — twelve seasons of yield in one column, which is the comparison the
 * old ratoon-capped model could not express.
 */
export default function PlantingCycles({ planting, onCycleStarted }: Props) {
  const [cycles, setCycles] = useState<CycleRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cropType = planting.crop_types;

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [list, harvests] = await Promise.all([
        PlantingService.listCycles(planting.id),
        HarvestService.listByPlanting(planting.id),
      ]);

      setCycles(
        list.map((cycle) => {
          const own = harvests.filter((h) => h.cycle_id === cycle.id);
          return {
            ...cycle,
            harvested: own.reduce((sum, h) => sum + Number(h.quantity ?? 0), 0),
            unit: own[0]?.quantity_unit ?? null,
          };
        })
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cycles');
    } finally {
      setIsLoading(false);
    }
  }, [planting.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStartNext = async () => {
    setStarting(true);
    setError(null);
    try {
      await PlantingService.startNextCycle(planting.id);
      await load();
      onCycleStarted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the next cycle');
    } finally {
      setStarting(false);
    }
  };

  const nextLabel = nextCycleLabel(cropType?.growing_type, cycles);
  const canAdvance =
    planting.status !== 'terminated' &&
    canStartNextCycle(cropType?.growing_type, cycles, cropType?.max_ratoon_cycles);

  return (
    <div className="space-y-3" data-testid="planting-cycles">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          Bearing history
        </h4>
        {nextLabel && canAdvance && (
          <Button
            size="sm"
            onClick={handleStartNext}
            disabled={starting}
            data-testid="start-next-cycle-button"
          >
            {starting ? 'Starting…' : nextLabel}
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" data-testid="cycle-error">
          {error}
        </p>
      )}

      {!nextLabel && !isLoading && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          A {cropType?.growing_type ?? 'crop'} planting does not carry over into another cycle.
        </p>
      )}

      {nextLabel && !canAdvance && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          This planting has reached its ratoon limit of {cropType?.max_ratoon_cycles}. Replant to
          start again.
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading cycles…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <tr>
                <th className="px-4 py-2 font-medium">Cycle</th>
                <th className="px-4 py-2 font-medium">Started</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Harvested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {cycles.map((cycle) => (
                <tr key={cycle.id} data-testid={`cycle-row-${cycle.cycle_number}`}>
                  <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                    {cycleLabel(cycle)}
                  </td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                    {cycle.start_date}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      data-testid={cycle.status === 'active' ? 'cycle-active' : undefined}
                      className={
                        cycle.status === 'active'
                          ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'text-xs text-gray-500 dark:text-gray-400'
                      }
                    >
                      {cycle.status === 'active' ? 'Bearing now' : cycle.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                    {cycle.harvested > 0 ? `${cycle.harvested} ${cycle.unit ?? ''}`.trim() : '—'}
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
