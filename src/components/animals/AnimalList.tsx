"use client";

import { useState, useEffect } from 'react';
import { useAnimals } from '@/hooks/useAnimals';
import { Animal } from '@/types/animal';
import AnimalCard from './AnimalCard';
import CreateAnimalModal from './CreateAnimalModal';
import EditAnimalModal from './EditAnimalModal';
import Button from '@/components/ui/button/Button';
import { useNotificationContext } from '@/providers/NotificationProvider';

interface AnimalListProps {
  farmId: string;
  herdId: string;
}

export default function AnimalList({ farmId, herdId }: AnimalListProps) {
  const { animals, isLoading, error, getHerdAnimals, addAnimal, editAnimal, removeAnimal } = useAnimals();
  const { addNotification } = useNotificationContext();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);

  useEffect(() => {
    if (farmId && herdId) {
      getHerdAnimals(farmId, herdId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId, herdId]);

  // Note: do not fetch herds here to avoid duplicate/looped fetches.

  const handleCreateAnimal = async (data: any) => {
    try {
      await addAnimal(farmId, herdId, data);
      addNotification({
        type: 'success',
        title: 'Animal Created',
        message: 'Animal has been created successfully',
      });
      setIsCreateModalOpen(false);
      // Refresh the list
      getHerdAnimals(farmId, herdId);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error || 'Failed to create animal',
      });
    }
  };

  const handleEditAnimal = async (animalId: string, data: any) => {
    try {
      await editAnimal(farmId, animalId, data);
      addNotification({
        type: 'success',
        title: 'Animal Updated',
        message: 'Animal has been updated successfully',
      });
      setEditingAnimal(null);
      // Refresh the list
      getHerdAnimals(farmId, herdId);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error || 'Failed to update animal',
      });
    }
  };

  const handleDeleteAnimal = async (animalId: string) => {
    if (!confirm('Are you sure you want to delete this animal?')) {
      return;
    }

    try {
      await removeAnimal(farmId, animalId);
      addNotification({
        type: 'success',
        title: 'Animal Deleted',
        message: 'Animal has been deleted successfully',
      });
      // Refresh the list
      getHerdAnimals(farmId, herdId);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error || 'Failed to delete animal',
      });
    }
  };

  return (
    <div className="space-y-4" data-testid="animals-section">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Animals</h3>
        <Button onClick={() => setIsCreateModalOpen(true)} data-testid="create-animal-button">
          Add Animal
        </Button>
      </div>

      {isLoading && <p className="text-center text-gray-500 dark:text-gray-400 py-4">Loading animals...</p>}
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {!isLoading && !error && animals && animals.length === 0 && (
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg text-gray-600 dark:text-gray-400">No animals yet</h3>
          <p className="text-gray-500 dark:text-gray-500 mt-2">
            Get started by adding your first animal to this herd
          </p>
          <Button 
            onClick={() => setIsCreateModalOpen(true)} 
            className="mt-4"
            data-testid="create-first-animal-button"
          >
            Add Your First Animal
          </Button>
        </div>
      )}

      {!isLoading && animals && animals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {animals.map((animal) => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              farmId={farmId}
              onEdit={() => setEditingAnimal(animal)}
              onDelete={() => handleDeleteAnimal(animal.id)}
            />
          ))}
        </div>
      )}

      {/* Create Animal Modal */}
      {isCreateModalOpen && (
        <CreateAnimalModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateAnimal}
          farmId={farmId}
          herdId={herdId}
        />
      )}

      {/* Edit Animal Modal */}
      {editingAnimal && (
        <EditAnimalModal
          isOpen={!!editingAnimal}
          onClose={() => setEditingAnimal(null)}
          onSubmit={(data) => handleEditAnimal(editingAnimal.id, data)}
          animal={editingAnimal}
          farmId={farmId}
        />
      )}
    </div>
  );
}

