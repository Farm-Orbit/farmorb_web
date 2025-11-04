"use client";

import { Animal } from '@/types/animal';
import Button from '@/components/ui/button/Button';

interface AnimalCardProps {
  animal: Animal;
  farmId: string;
  onEdit: () => void;
  onDelete: () => void;
}

export default function AnimalCard({ animal, farmId, onEdit, onDelete }: AnimalCardProps) {
  const statusLabels: Record<string, string> = {
    active: 'Active',
    sold: 'Sold',
    deceased: 'Deceased',
    culled: 'Culled',
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'sold':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'deceased':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'culled':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTrackingIcon = () => {
    switch (animal.tracking_type) {
      case 'individual':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'batch':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
          </svg>
        );
    }
  };

  return (
    <div 
      className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden"
      data-testid={`animal-card-${animal.id}`}
    >
      {/* Header with tag badge */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getTrackingIcon()}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-amber-200 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 font-mono border border-amber-300 dark:border-amber-800">
                {animal.tag_id}
              </span>
              {animal.tracking_type && (
                <span className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  {animal.tracking_type.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(animal.status)}`}>
            {statusLabels[animal.status] || animal.status}
          </span>
        </div>
      </div>

      {/* Card content */}
      <div className="p-4 space-y-3">
        {/* Name */}
        {animal.name && (
          <h4 className="text-base font-bold text-gray-900 dark:text-white">
            {animal.name}
          </h4>
        )}

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {animal.breed && (
            <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="truncate">{animal.breed}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className={`text-lg ${animal.sex === 'male' ? 'text-blue-600 dark:text-blue-400' : 'text-pink-600 dark:text-pink-400'}`}>
              {animal.sex === 'male' ? '♂' : '♀'}
            </span>
            <span className="text-gray-700 dark:text-gray-300">{animal.sex === 'male' ? 'Male' : 'Female'}</span>
          </div>

          {animal.birth_date && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 col-span-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs">Born: {formatDate(animal.birth_date)}</span>
            </div>
          )}

          {animal.color && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 col-span-2">
              <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: animal.color.toLowerCase() }}></div>
              <span className="text-xs">{animal.color}</span>
            </div>
          )}

          {animal.markings && (
            <div className="col-span-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30 p-2 rounded">
              <span className="font-medium">Markings:</span> {animal.markings}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onEdit}
            data-testid={`edit-animal-${animal.id}`}
            className="flex-1 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onDelete}
            data-testid={`delete-animal-${animal.id}`}
            className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}

