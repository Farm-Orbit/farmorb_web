"use client";

import { Herd } from '@/types/herd';
import Button from '@/components/ui/button/Button';
import AnimalList from '@/components/animals/AnimalList';

interface HerdCardProps {
  herd: Herd;
  farmId: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function HerdCard({ herd, farmId, isExpanded, onToggleExpand, onEdit, onDelete }: HerdCardProps) {
  const purposeLabels: Record<string, string> = {
    dairy: 'Dairy',
    beef: 'Beef',
    breeding: 'Breeding',
    weaners: 'Weaners',
    poultry: 'Poultry',
  };

  const speciesTypeLabels: Record<string, string> = {
    mammal: 'Mammal',
    poultry: 'Poultry',
  };

  return (
    <div 
      className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow duration-200"
      data-testid={`herd-card-${herd.id}`}
    >
      {/* Header bar with icon and badges */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {herd.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                {herd.purpose && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {purposeLabels[herd.purpose] || herd.purpose}
                  </span>
                )}
                <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  {speciesTypeLabels[herd.species_type] || herd.species_type}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEdit}
              data-testid={`edit-herd-${herd.id}`}
              className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onDelete}
              data-testid={`delete-herd-${herd.id}`}
              className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Details section */}
        <div className="space-y-3 mb-4">
          {herd.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{herd.location}</span>
            </div>
          )}

          {herd.description && (
            <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/30 p-3 rounded-lg">
              {herd.description}
            </p>
          )}
        </div>

        {/* View animals button */}
        <button
          onClick={onToggleExpand}
          data-testid={`toggle-animals-${herd.id}`}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span>{isExpanded ? 'Hide' : 'View'} Animals</span>
        </button>
      </div>

      {/* Expandable animals list */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-800">
          <div className="p-6">
            <AnimalList farmId={farmId} herdId={herd.id} />
          </div>
        </div>
      )}
    </div>
  );
}

