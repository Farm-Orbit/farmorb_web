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
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden"
      data-testid={`herd-card-${herd.id}`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {herd.name}
              </h3>
              {herd.purpose && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                  {purposeLabels[herd.purpose] || herd.purpose}
                </span>
              )}
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {herd.location && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{herd.location}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{speciesTypeLabels[herd.species_type] || herd.species_type}</span>
              </div>

              {herd.description && (
                <p className="mt-2 text-gray-700 dark:text-gray-300">{herd.description}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 ml-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEdit}
              data-testid={`edit-herd-${herd.id}`}
            >
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onDelete}
              data-testid={`delete-herd-${herd.id}`}
            >
              Delete
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onToggleExpand}
            data-testid={`toggle-animals-${herd.id}`}
          >
            {isExpanded ? 'Hide Animals' : 'View Animals'}
          </Button>
        </div>
      </div>

      {/* Expandable animals list */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/50">
          <AnimalList farmId={farmId} herdId={herd.id} />
        </div>
      )}
    </div>
  );
}

