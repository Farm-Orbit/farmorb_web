"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { Animal } from '@/types/animal';
import { useAnimals } from '@/hooks/useAnimals';
import { useHerds } from '@/hooks/useHerds';

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
  const { herds, getFarmHerds } = useHerds();
  const [allAnimals, setAllAnimals] = useState<Animal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Load all herds for the farm
  useEffect(() => {
    if (farmId) {
      getFarmHerds(farmId);
    }
  }, [farmId, getFarmHerds]);

  // Load animals from all herds
  useEffect(() => {
    const loadAllAnimals = async () => {
      if (!herds || herds.length === 0) {
        setAllAnimals([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Import animalService dynamically to avoid circular dependencies
        const { AnimalService } = await import('@/services/animalService');
        
        // Fetch animals from all herds
        const animalPromises = herds.map(herd => 
          AnimalService.getHerdAnimals(farmId, herd.id).then(animals => ({
            animals: animals || [],
            herdId: herd.id,
            herdName: herd.name,
          }))
        );

        const results = await Promise.all(animalPromises);
        
        // Flatten all animals and add herd info
        const animals = results.flatMap(result => 
          result.animals.map(animal => ({
            ...animal,
            herdName: result.herdName,
          }))
        );

        setAllAnimals(animals);
      } catch (error) {
        console.error('Failed to load animals:', error);
        setAllAnimals([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllAnimals();
  }, [herds, farmId]);

  // Filter animals based on status
  const filteredAnimals = useMemo(() => {
    if (filterStatus === 'all') return allAnimals;
    return allAnimals.filter(animal => animal.status === filterStatus);
  }, [allAnimals, filterStatus]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Define columns
  const columns = useMemo<MRT_ColumnDef<Animal & { herdName?: string }>[]>(
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
        accessorKey: 'herdName',
        header: 'Herd',
        size: 150,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-900 dark:text-white">
            {cell.getValue<string>() || 'Unknown'}
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
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing all animals across all herds in this farm
        </p>
      </div>

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
    </div>
  );
}

