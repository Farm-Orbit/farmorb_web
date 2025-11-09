"use client";

import { useRouter, useParams } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import AnimalForm, { AnimalFormValues } from '@/components/animals/AnimalForm';
import Button from '@/components/ui/button/Button';
import { useAnimals } from '@/hooks/useAnimals';
import { CreateAnimalData } from '@/types/animal';

export default function EditAnimalPage() {
  const router = useRouter();
  const params = useParams();
  const {
    currentAnimal,
    isLoading,
    getAnimalById,
    editAnimal,
    clearAnimalError,
    selectAnimal,
  } = useAnimals();

  const farmId = params.id as string;
  const animalId = params.animalId as string;

  useEffect(() => {
    if (farmId && animalId) {
      getAnimalById(farmId, animalId).catch((error) => {
        console.error('Failed to load animal', error);
      });
    }

    return () => {
      selectAnimal(null);
    };
  }, [farmId, animalId, getAnimalById, selectAnimal]);

  const handleSubmit = useCallback(
    async (data: Partial<CreateAnimalData & { status?: string }>) => {
      await editAnimal(farmId, animalId, data);
      router.push(`/farms/${farmId}?tab=animals`);
    },
    [editAnimal, farmId, animalId, router]
  );

  const handleCancel = useCallback(() => {
    clearAnimalError();
    router.back();
  }, [clearAnimalError, router]);

  if (!farmId || !animalId) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Invalid Animal</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            We couldn’t find the animal you’re trying to edit.
          </p>
          <Button onClick={() => router.push('/farms')}>Back to Farms</Button>
        </div>
      </div>
    );
  }

  if (isLoading && !currentAnimal) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading animal...</p>
        </div>
      </div>
    );
  }

  if (!currentAnimal) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Animal Not Found</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The animal you are trying to edit does not exist or you do not have access.
          </p>
          <Button onClick={() => router.push(`/farms/${farmId}?tab=animals`)}>Back to Animals</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Animal</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Update livestock information to keep your records accurate.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <AnimalForm
          mode="edit"
          initialValues={{
            tag_id: currentAnimal.tag_id,
            name: currentAnimal.name ?? '',
            breed: currentAnimal.breed ?? '',
            sex: currentAnimal.sex,
            birth_date: currentAnimal.birth_date ? currentAnimal.birth_date.split('T')[0] : '',
            color: currentAnimal.color ?? '',
            markings: currentAnimal.markings ?? '',
            tracking_type: currentAnimal.tracking_type,
            status: currentAnimal.status as AnimalFormValues['status'],
          }}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Update Animal"
          cancelLabel="Cancel"
        />
      </div>
    </div>
  );
}
