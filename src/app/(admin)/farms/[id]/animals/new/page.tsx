"use client";

import { useRouter, useParams } from 'next/navigation';
import { useCallback } from 'react';
import AnimalForm from '@/components/animals/AnimalForm';
import Button from '@/components/ui/button/Button';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { useAnimals } from '@/hooks/useAnimals';
import { CreateAnimalData } from '@/types/animal';

export default function CreateAnimalPage() {
  const router = useRouter();
  const params = useParams();
  const { addAnimal, clearAnimalError } = useAnimals();
  const farmId = params.id as string;

  const handleSubmit = useCallback(
    async (data: Partial<CreateAnimalData>) => {
      await addAnimal(farmId, data as CreateAnimalData);
      router.push(`/farms/${farmId}?tab=animals`);
    },
    [addAnimal, farmId, router]
  );

  const handleCancel = useCallback(() => {
    clearAnimalError();
    router.back();
  }, [clearAnimalError, router]);

  if (!farmId) {
    return (
      <div className="w-full p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Invalid Farm</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            We couldn’t find the farm you’re trying to manage.
          </p>
          <Button onClick={() => router.push('/farms')}>Back to Farms</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full p-6 space-y-6">
      <div className="mb-4">
        <Breadcrumbs farmId={farmId} />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Add Animal</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Record livestock information to keep track of your farm inventory.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <AnimalForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Add Animal"
          cancelLabel="Cancel"
        />
      </div>
    </div>
  );
}
