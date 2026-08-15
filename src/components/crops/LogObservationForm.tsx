"use client";

import { FormEvent, useState } from 'react';
import Button from '@/components/ui/button/Button';
import { FarmFileService, ObservationService } from '@/services/activityService';
import { Attachment, ObservationType, Severity } from '@/types/activity';
import { Planting } from '@/types/crop';
import { fieldClass, optionClass } from './fieldStyles';

interface Props {
  farmId: string;
  plantings: Planting[];
  defaultPlantingId?: string | null;
  onSaved: (message: string) => void;
  onCancel: () => void;
}

const TYPES: { value: ObservationType; label: string }[] = [
  { value: 'disease', label: 'Disease' },
  { value: 'pest', label: 'Pest' },
  { value: 'deficiency', label: 'Deficiency' },
  { value: 'damage', label: 'Damage' },
  { value: 'other', label: 'Other' },
];

/**
 * Worded, not numeric. "Moderate" means roughly the same thing to two people
 * on two days; a 1-10 score does not, and scouting data is only useful if it
 * is comparable over a season.
 */
const SEVERITIES: { value: Severity; label: string }[] = [
  { value: 'trace', label: 'Trace' },
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
  { value: 'severe', label: 'Severe' },
];

export default function LogObservationForm({
  farmId,
  plantings,
  defaultPlantingId,
  onSaved,
  onCancel,
}: Props) {
  const [plantingId, setPlantingId] = useState(defaultPlantingId ?? plantings[0]?.id ?? '');
  const [observedOn, setObservedOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<ObservationType>('disease');
  const [problemName, setProblemName] = useState('');
  const [severity, setSeverity] = useState<Severity>('low');
  const [incidence, setIncidence] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [showMore, setShowMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!plantingId) {
      setError('Choose a block.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Upload first: an observation saved without its photo loses the part
      // that actually identifies the problem.
      const attachments: Attachment[] = [];
      for (const file of files) {
        attachments.push(await FarmFileService.upload(farmId, 'observations', file));
      }

      await ObservationService.create(farmId, {
        planting_id: plantingId,
        observed_on: observedOn,
        observation_type: type,
        problem_name: problemName || null,
        severity,
        incidence_percent: incidence ? Number(incidence) : null,
        notes: notes || null,
        attachments,
      });

      onSaved(
        `Recorded ${severity} ${problemName || type}${
          attachments.length ? ` with ${attachments.length} photo${attachments.length > 1 ? 's' : ''}` : ''
        }.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the observation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
      data-testid="log-observation-form"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">Where</span>
          <select
            required
            value={plantingId}
            onChange={(e) => setPlantingId(e.target.value)}
            className={`${fieldClass} w-full`}
            data-testid="observation-planting-select"
          >
            {plantings.map((p) => (
              <option className={optionClass} key={p.id} value={p.id}>
                {p.crop_types?.name ?? 'Crop'} · {p.grow_locations?.name ?? 'Block'}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">When</span>
          <input
            required
            type="date"
            value={observedOn}
            onChange={(e) => setObservedOn(e.target.value)}
            className={`${fieldClass} w-full`}
            data-testid="observation-date-input"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">What kind</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ObservationType)}
            className={`${fieldClass} w-full`}
            data-testid="observation-type-select"
          >
            {TYPES.map((t) => (
              <option className={optionClass} key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            What is it (if you know)
          </span>
          <input
            value={problemName}
            onChange={(e) => setProblemName(e.target.value)}
            placeholder="Anthracnose"
            className={`${fieldClass} w-full`}
            data-testid="observation-name-input"
          />
        </label>
      </div>

      <div className="space-y-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">How bad</span>
        <div className="flex flex-wrap gap-2" data-testid="observation-severity">
          {SEVERITIES.map((s) => (
            <button
              type="button"
              key={s.value}
              onClick={() => setSeverity(s.value)}
              aria-pressed={severity === s.value}
              data-testid={`severity-${s.value}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                severity === s.value
                  ? 'border-brand-500 bg-brand-500 text-white'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-white/[0.05]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* The photograph is the record — a lesion is identified from the image
          and compared to last week's, not from a dropdown. */}
      <label className="space-y-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">Photos</span>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className={`${fieldClass} w-full`}
          data-testid="observation-photo-input"
        />
        {files.length > 0 && (
          <span className="text-xs text-gray-600 dark:text-gray-300">
            {files.length} photo{files.length > 1 ? 's' : ''} ready
          </span>
        )}
      </label>

      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="text-xs font-medium text-brand-500 hover:underline"
        data-testid="observation-more-toggle"
      >
        {showMore ? 'Fewer details' : 'More details'}
      </button>

      {showMore && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Plants affected (%)
            </span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={incidence}
              onChange={(e) => setIncidence(e.target.value)}
              className={`${fieldClass} w-full`}
              data-testid="observation-incidence-input"
            />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Notes</span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${fieldClass} w-full`}
              data-testid="observation-notes-input"
            />
          </label>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" data-testid="observation-error">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={submitting} data-testid="save-observation-button">
          {submitting ? 'Saving…' : 'Record it'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
