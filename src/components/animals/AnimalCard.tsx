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

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 space-y-3 border border-gray-200 dark:border-gray-700"
      data-testid={`animal-card-${animal.id}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            {animal.name || `Tag: ${animal.tag_id}`}
          </h4>
          {animal.name && (
            <p className="text-sm text-gray-500 dark:text-gray-400">Tag: {animal.tag_id}</p>
          )}
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(animal.status)}`}>
          {statusLabels[animal.status] || animal.status}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
        {animal.breed && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{animal.breed}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{animal.sex === 'male' ? '♂ Male' : '♀ Female'}</span>
        </div>

        {animal.birth_date && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>DOB: {formatDate(animal.birth_date)}</span>
          </div>
        )}

        {animal.color && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            <span>{animal.color}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onEdit}
          data-testid={`edit-animal-${animal.id}`}
        >
          Edit
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onDelete}
          data-testid={`delete-animal-${animal.id}`}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

