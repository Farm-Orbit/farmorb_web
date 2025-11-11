"use client";

import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import { useAnimals } from '@/hooks/useAnimals';
import { GroupService } from '@/services/groupService';
import { Animal } from '@/types/animal';
import { type MRT_ColumnDef } from 'material-react-table';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { useModal } from '@/hooks/useModal';
import Button from '@/components/ui/button/Button';
import Label from '@/components/form/Label';
import { AnimalService } from '@/services/animalService';
import { ListOptions } from '@/types/list';

interface GroupAnimalsTableProps {
  farmId: string;
  groupId: string;
}

interface AnimalGroupRelation {
  id: string;
  animal_id: string;
  group_id: string;
  added_at: string;
  added_by?: string;
  notes?: string;
  animal?: {
    id: string;
    tag_id: string;
    name?: string;
    species: string;
    status: string;
  };
}

export default function GroupAnimalsTable({ farmId, groupId }: GroupAnimalsTableProps) {
  const router = useRouter();
  const { getAnimalById } = useAnimals();
  const [animalRelations, setAnimalRelations] = useState<AnimalGroupRelation[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [availableAnimals, setAvailableAnimals] = useState<Animal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const { isOpen, openModal, closeModal } = useModal();

  const fetchAnimals = useCallback(async () => {
    if (!groupId) {
      setAnimals([]);
      return;
    }

    setIsLoading(true);
    try {
      const result = await GroupService.getGroupAnimals(groupId, {
        page: 1,
        pageSize: 200, // Get all animals in the group
      });

      setAnimalRelations(result.items || []);

      // Fetch full animal details for each animal in the group
      const animalPromises = (result.items || []).map(async (relation: AnimalGroupRelation) => {
        try {
          const animal = await getAnimalById(farmId, relation.animal_id);
          return animal;
        } catch (error) {
          console.error(`Failed to load animal ${relation.animal_id}:`, error);
          return null;
        }
      });

      const fetchedAnimals = await Promise.all(animalPromises);
      setAnimals(fetchedAnimals.filter((a): a is Animal => a !== null));
    } catch (error) {
      console.error('Failed to load group animals:', error);
      setAnimals([]);
    } finally {
      setIsLoading(false);
    }
  }, [farmId, groupId, getAnimalById]);

  useEffect(() => {
    fetchAnimals();
  }, [fetchAnimals]);

  // Fetch available animals when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadAvailableAnimals = async () => {
        try {
          const result = await AnimalService.getFarmAnimals(farmId, {
            page: 1,
            pageSize: 200, // Get all animals
          } as ListOptions);
          
          // Filter out animals that are already in this group
          const animalIdsInGroup = new Set(animals.map(a => a.id));
          const available = (result.items || []).filter(
            (animal: Animal) => !animalIdsInGroup.has(animal.id)
          );
          
          setAvailableAnimals(available);
        } catch (error) {
          console.error('Failed to load available animals:', error);
          setAvailableAnimals([]);
        }
      };
      
      loadAvailableAnimals();
    } else {
      // Reset form when modal closes
      setSelectedAnimalId('');
      setNotes('');
    }
  }, [isOpen, farmId, animals]);

  const handleAddAnimal = async () => {
    if (!selectedAnimalId) {
      return;
    }

    setIsAdding(true);
    try {
      await GroupService.addAnimalToGroup(groupId, selectedAnimalId, {
        notes: notes || undefined,
      });
      
      // Refresh the animals list
      await fetchAnimals();
      
      // Reset form and close modal
      setSelectedAnimalId('');
      setNotes('');
      closeModal();
    } catch (error) {
      console.error('Failed to add animal to group:', error);
      alert('Failed to add animal to group. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveAnimal = useCallback(async (animalId: string, animalTagId: string) => {
    if (!window.confirm(`Are you sure you want to remove ${animalTagId} from this group?`)) {
      return;
    }

    try {
      await GroupService.removeAnimalFromGroup(groupId, animalId);
      
      // Refresh the animals list
      await fetchAnimals();
    } catch (error) {
      console.error('Failed to remove animal from group:', error);
      alert('Failed to remove animal from group. Please try again.');
    }
  }, [groupId, fetchAnimals]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'sold':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'deceased':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'culled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const columns = useMemo<MRT_ColumnDef<Animal>[]>(
    () => [
      {
        accessorKey: 'tag_id',
        header: 'Tag ID',
        size: 150,
        Cell: ({ cell, row }) => (
          <button
            type="button"
            onClick={() => router.push(`/farms/${farmId}/animals/${row.original.id}`)}
            className="text-sm font-mono font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {cell.getValue<string>()}
          </button>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        size: 150,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-900 dark:text-white">{cell.getValue<string>() || '-'}</span>
        ),
      },
      {
        accessorKey: 'species',
        header: 'Species',
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-900 dark:text-white capitalize">
            {cell.getValue<string>() || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'breed',
        header: 'Breed',
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">{cell.getValue<string>() || '-'}</span>
        ),
      },
      {
        accessorKey: 'sex',
        header: 'Sex',
        size: 100,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-900 dark:text-white capitalize">
            {cell.getValue<string>() || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 120,
        Cell: ({ cell }) => {
          const status = cell.getValue<string>();
          return (
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 100,
        enableColumnFilter: false,
        enableSorting: false,
        Cell: ({ row }) => {
          const animal = row.original;
          return (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
              onClick={() => handleRemoveAnimal(animal.id, animal.tag_id)}
            >
              Remove
            </Button>
          );
        },
      },
    ],
    [farmId, router, handleRemoveAnimal]
  );

  if (isLoading && animals.length === 0) {
    return (
      <div className="text-center p-12">
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading animals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={openModal}
          size="sm"
          data-testid="add-animal-to-group-button"
        >
          Add Animal
        </Button>
      </div>

      {isLoading && animals.length === 0 ? (
        <div className="text-center p-12">
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading animals...</p>
        </div>
      ) : animals.length === 0 ? (
        <div
          className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          data-testid="group-animals-empty"
        >
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No animals</h3>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            This group doesn't have any animals assigned to it yet.
          </p>
        </div>
      ) : (
        <div data-testid="group-animals-table">
          <CustomMaterialTable
            columns={columns}
            data={animals}
            isLoading={isLoading}
            getRowId={(row) => row.id}
            enableRowSelection={false}
            enableColumnFilters={false}
            enableGlobalFilter={false}
            enablePagination={false}
          />
        </div>
      )}

      {/* Add Animal Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[500px] m-4">
        <div className="p-6">
          <h4 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Add Animal to Group
          </h4>

          <div className="space-y-4">
            <div>
              <Label>Animal *</Label>
              <select
                value={selectedAnimalId}
                onChange={(e) => setSelectedAnimalId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                data-testid="animal-select"
              >
                <option value="">Select an animal...</option>
                {availableAnimals.map((animal) => (
                  <option key={animal.id} value={animal.id}>
                    {animal.tag_id} {animal.name ? `- ${animal.name}` : ''}
                  </option>
                ))}
              </select>
              {availableAnimals.length === 0 && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  No available animals to add. All animals are already in this group.
                </p>
              )}
            </div>

            <div>
              <Label>Notes (optional)</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                placeholder="Add any notes about this assignment..."
                data-testid="add-animal-notes-textarea"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 sm:justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={closeModal}
              disabled={isAdding}
              data-testid="cancel-add-animal-button"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddAnimal}
              disabled={!selectedAnimalId || isAdding}
              data-testid="add-animal-submit-button"
            >
              {isAdding ? 'Adding...' : 'Add Animal'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

