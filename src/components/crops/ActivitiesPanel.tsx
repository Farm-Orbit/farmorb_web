"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/button/Button';
import { ActivityService, ObservationService } from '@/services/activityService';
import { PlantingService } from '@/services/plantingService';
import LogActivityForm from './LogActivityForm';
import LogObservationForm from './LogObservationForm';
import AttachmentThumbs from './AttachmentThumbs';
import { CropActivity, CropObservation } from '@/types/activity';
import { Planting } from '@/types/crop';
import { fieldClass, optionClass } from './fieldStyles';

interface Props {
  farmId: string;
}

type Filter = 'all' | 'spray' | 'field' | 'observations';

const TYPE_LABELS: Record<string, string> = {
  spray: 'Spray',
  fertilisation: 'Fertilising',
  irrigation: 'Irrigation',
  pruning: 'Pruning',
  induction: 'Flower induction',
  thinning: 'Thinning',
  bagging: 'Bagging',
  weeding: 'Weeding',
  land_prep: 'Land preparation',
  other: 'Other',
};

const SEVERITY_STYLES: Record<string, string> = {
  trace: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300',
  low: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300',
  moderate: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  severe: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

/** A batch written as one submission is presented as one entry, not six. */
interface Group {
  key: string;
  date: string;
  kind: 'activity' | 'observation';
  activity?: CropActivity;
  observation?: CropObservation;
  targetCount: number;
}

export default function ActivitiesPanel({ farmId }: Props) {
  const [activities, setActivities] = useState<CropActivity[]>([]);
  const [observations, setObservations] = useState<CropObservation[]>([]);
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [mode, setMode] = useState<'activity' | 'observation' | null>(null);
  // Most field work repeats the last one; reopening it prefilled removes
  // nearly all the typing from routine jobs.
  const [repeatOf, setRepeatOf] = useState<CropActivity | null>(null);
  const [repeatTargetIds, setRepeatTargetIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [acts, obs, plants] = await Promise.all([
        ActivityService.list(farmId),
        ObservationService.list(farmId),
        PlantingService.list(farmId),
      ]);
      setActivities(acts);
      setObservations(obs);
      setPlantings(plants);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    load();
  }, [load]);

  const groups = useMemo<Group[]>(() => {
    const seenBatches = new Set<string>();
    const rows: Group[] = [];

    for (const a of activities) {
      if (a.batch_id) {
        if (seenBatches.has(a.batch_id)) continue;
        seenBatches.add(a.batch_id);
        rows.push({
          key: a.batch_id,
          date: a.activity_date,
          kind: 'activity',
          activity: a,
          targetCount: activities.filter((x) => x.batch_id === a.batch_id).length,
        });
      } else {
        rows.push({ key: a.id, date: a.activity_date, kind: 'activity', activity: a, targetCount: 1 });
      }
    }

    for (const o of observations) {
      rows.push({ key: o.id, date: o.observed_on, kind: 'observation', observation: o, targetCount: 1 });
    }

    return rows.sort((x, y) => (x.date < y.date ? 1 : -1));
  }, [activities, observations]);

  const visible = groups.filter((g) => {
    if (filter === 'all') return true;
    if (filter === 'observations') return g.kind === 'observation';
    if (filter === 'spray') return g.activity?.activity_type === 'spray';
    return g.kind === 'activity';
  });

  return (
    <div className="space-y-6" data-testid="activities-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Activities</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Everything done to the crop between planting and harvest.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              setRepeatOf(null);
              setRepeatTargetIds([]);
              setMode((m) => (m === 'activity' ? null : 'activity'));
            }}
            data-testid="log-activity-button"
          >
            {mode === 'activity' ? 'Cancel' : 'Log activity'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMode((m) => (m === 'observation' ? null : 'observation'))}
            data-testid="log-observation-button"
          >
            {mode === 'observation' ? 'Cancel' : 'Report a problem'}
          </Button>
        </div>
      </div>

      {flash && (
        <p
          className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400"
          data-testid="activity-flash"
        >
          {flash}
        </p>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {mode === 'activity' && (
        <LogActivityForm
          key={repeatOf?.id ?? 'new'}
          farmId={farmId}
          plantings={plantings}
          repeatOf={repeatOf}
          repeatTargetIds={repeatTargetIds}
          onCancel={() => {
            setMode(null);
            setRepeatOf(null);
          }}
          onSaved={(message) => {
            setMode(null);
            setRepeatOf(null);
            setFlash(message);
            load();
          }}
        />
      )}

      {mode === 'observation' && (
        <LogObservationForm
          farmId={farmId}
          plantings={plantings}
          onCancel={() => setMode(null)}
          onSaved={(message) => {
            setMode(null);
            setFlash(message);
            load();
          }}
        />
      )}

      <div className="flex items-center gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
          className={fieldClass}
          data-testid="activity-filter-select"
          aria-label="Filter activities"
        >
          <option className={optionClass} value="all">Everything</option>
          <option className={optionClass} value="field">Field work</option>
          <option className={optionClass} value="spray">Sprays only</option>
          <option className={optionClass} value="observations">Pests &amp; disease</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading activities…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-gray-500" data-testid="activities-empty">
          Nothing logged yet.
        </p>
      ) : (
        <ul className="space-y-2" data-testid="activity-timeline">
          {visible.map((g) => (
            <li
              key={g.key}
              className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
              data-testid={`timeline-${g.kind}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {g.kind === 'activity'
                    ? TYPE_LABELS[g.activity!.activity_type] ?? g.activity!.activity_type
                    : g.observation!.problem_name || g.observation!.observation_type}
                  {g.kind === 'activity' && g.activity!.product_name && (
                    <span className="font-normal text-gray-600 dark:text-gray-300">
                      {' '}· {g.activity!.product_name}
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-3">
                  {g.kind === 'activity' && (
                    <button
                      type="button"
                      onClick={() => {
                        const original = g.activity!;
                        const siblings = original.batch_id
                          ? activities.filter((a) => a.batch_id === original.batch_id)
                          : [original];
                        setRepeatOf(original);
                        setRepeatTargetIds(
                          siblings.map((a) => a.planting_id).filter((id): id is string => Boolean(id))
                        );
                        setMode('activity');
                      }}
                      className="text-xs font-medium text-brand-500 hover:underline"
                      data-testid="repeat-activity-button"
                    >
                      Repeat
                    </button>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400">{g.date}</span>
                </span>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                {g.targetCount > 1 ? (
                  <span data-testid="timeline-batch-count">{g.targetCount} blocks</span>
                ) : (
                  <span>
                    {g.kind === 'activity'
                      ? g.activity!.plantings?.crop_types?.name ??
                        g.activity!.grow_locations?.name ??
                        '—'
                      : g.observation!.plantings?.crop_types?.name ?? '—'}
                  </span>
                )}

                {g.kind === 'activity' && g.activity!.quantity != null && (
                  <span>
                    {g.activity!.quantity} {g.activity!.quantity_unit}
                  </span>
                )}

                {g.kind === 'activity' && g.activity!.phi_days != null && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                    {g.activity!.phi_days} day interval
                  </span>
                )}

                {g.kind === 'observation' && (
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium ${
                      SEVERITY_STYLES[g.observation!.severity]
                    }`}
                  >
                    {g.observation!.severity}
                  </span>
                )}

                {g.kind === 'observation' && g.observation!.incidence_percent != null && (
                  <span>{g.observation!.incidence_percent}% affected</span>
                )}
              </div>

              {g.kind === 'observation' && (
                <AttachmentThumbs attachments={g.observation!.attachments} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
