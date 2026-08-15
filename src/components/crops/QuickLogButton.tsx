"use client";

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PlantingService } from '@/services/plantingService';
import { Planting } from '@/types/crop';
import LogActivityForm from './LogActivityForm';
import LogObservationForm from './LogObservationForm';

/**
 * Recording should never begin with navigation. This sits in the header, so
 * from anywhere inside a farm the sequence is tap → log → done, rather than
 * find the farm, find the tab, find the button.
 *
 * It renders nothing outside a farm, where there is no context to inherit.
 */
export default function QuickLogButton() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const match = pathname.match(/^\/farms\/([^/]+)/);
  const farmId = match && match[1] !== 'create' ? match[1] : null;

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'activity' | 'observation'>('activity');
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [flash, setFlash] = useState<string | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setFlash(null);
  }, []);

  useEffect(() => {
    if (!open || !farmId) return;
    PlantingService.list(farmId).then(setPlantings).catch(() => setPlantings([]));
  }, [open, farmId]);

  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [open, close]);

  if (!farmId) return null;

  const handleSaved = (message: string) => {
    setFlash(message);
    // If the activities tab is already open behind the dialog, refresh it so
    // the new entry appears rather than going missing until a manual reload.
    if (searchParams.get('tab') === 'activities') {
      router.refresh();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="quick-log-button"
        className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-600"
      >
        <span aria-hidden="true" className="text-lg leading-none">+</span>
        <span className="hidden sm:inline">Log</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100000] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Log farm activity"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl dark:bg-gray-900"
            data-testid="quick-log-dialog"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('activity')}
                  aria-pressed={mode === 'activity'}
                  data-testid="quick-log-mode-activity"
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    mode === 'activity'
                      ? 'bg-brand-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  Activity
                </button>
                <button
                  type="button"
                  onClick={() => setMode('observation')}
                  aria-pressed={mode === 'observation'}
                  data-testid="quick-log-mode-observation"
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    mode === 'observation'
                      ? 'bg-brand-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  Problem
                </button>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                data-testid="quick-log-close"
                className="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.05]"
              >
                ✕
              </button>
            </div>

            {flash ? (
              <div className="space-y-4" data-testid="quick-log-flash">
                <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  {flash}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFlash(null)}
                    className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white"
                    data-testid="quick-log-again"
                  >
                    Log another
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-300"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : mode === 'activity' ? (
              <LogActivityForm
                farmId={farmId}
                plantings={plantings}
                onCancel={close}
                onSaved={handleSaved}
              />
            ) : (
              <LogObservationForm
                farmId={farmId}
                plantings={plantings}
                onCancel={close}
                onSaved={handleSaved}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
