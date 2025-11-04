"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { Animal } from '@/types/animal';
import { AnimalService } from '@/services/animalService';
import CreateAnimalModal from './CreateAnimalModal';
import Button from '@/components/ui/button/Button';

interface AnimalsTableProps {
  farmId: string;
}

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

export default function AnimalsTable({ farmId }: AnimalsTableProps) {
  const router = useRouter();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load all animals for the farm
  const loadAnimals = async () => {
    if (!farmId) return;

    setIsLoading(true);
    try {
      const data = await AnimalService.getFarmAnimals(farmId);
      setAnimals(data || []);
    } catch (error) {
      console.error('Failed to load animals:', error);
      setAnimals([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnimals();
  }, [farmId]);

  // Filter animals based on status
  const filteredAnimals = useMemo(() => {
    if (filterStatus === 'all') {
      return animals;
    }
    return animals.filter(animal => animal.status === filterStatus);
  }, [animals, filterStatus]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Define columns
  const columns = useMemo<MRT_ColumnDef<Animal>[]>(
    () => [
      {
        accessorKey: 'tag_id',
        header: 'Tag ID',
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-sm font-mono font-medium text-gray-900 dark:text-white">
            {cell.getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        size: 150,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-900 dark:text-white">
            {cell.getValue<string>() || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'breed',
        header: 'Breed',
        size: 130,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {cell.getValue<string>() || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'sex',
        header: 'Sex',
        size: 100,
        Cell: ({ cell }) => {
          const sex = cell.getValue<string>();
          return (
            <span className="text-sm text-gray-900 dark:text-white">
              {sex === 'male' ? '♂ Male' : '♀ Female'}
            </span>
          );
        },
      },
      {
        accessorKey: 'birth_date',
        header: 'Birth Date',
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(cell.getValue<string>())}
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
              {statusLabels[status] || status}
            </span>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end items-center">
        <Button
          onClick={() => setShowCreateModal(true)}
          size="sm"
          data-testid="create-animal-button"
        >
          Add Animal
        </Button>
      </div>

      {!isLoading && (!animals || animals.length === 0) ? (
        <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg text-gray-600 dark:text-gray-400 font-medium">No animals found</h3>
          <p className="text-gray-500 dark:text-gray-500 mt-2">
            Get started by adding your first animal
          </p>
        </div>
      ) : (
        <CustomMaterialTable
          columns={columns}
          data={filteredAnimals}
          isLoading={isLoading}
          getRowId={(row) => row.id}
          enableRowSelection={false}
          renderTopToolbarCustomActions={() => (
            <div className="flex gap-2 items-center">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="sold">Sold</option>
                <option value="deceased">Deceased</option>
                <option value="culled">Culled</option>
              </select>
            </div>
          )}
        />
      )}

      {showCreateModal && (
        <CreateAnimalModal
          farmId={farmId}
          onClose={() => {
            setShowCreateModal(false);
            // Reload animals after creating
            loadAnimals();
          }}
        />
      )}
    </div>
  );
}

