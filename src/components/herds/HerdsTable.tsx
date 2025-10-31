"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { Herd } from '@/types/herd';
import { useHerds } from '@/hooks/useHerds';
import Button from '@/components/ui/button/Button';
import CreateHerdModal from './CreateHerdModal';
import EditHerdModal from './EditHerdModal';

interface HerdsTableProps {
  farmId: string;
}

export default function HerdsTable({ farmId }: HerdsTableProps) {
  const router = useRouter();
  const { herds, isLoading, error, getFarmHerds, removeHerd } = useHerds();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingHerd, setEditingHerd] = useState<Herd | null>(null);
  const [filterSpecies, setFilterSpecies] = useState<string>('all');
  const [animalCounts, setAnimalCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (farmId) {
      getFarmHerds(farmId);
    }
  }, [farmId, getFarmHerds]);

  // Load animal counts for each herd
  useEffect(() => {
    const loadAnimalCounts = async () => {
      if (!herds || herds.length === 0) return;

      try {
        const { AnimalService } = await import('@/services/animalService');
        
        const countPromises = herds.map(herd =>
          AnimalService.getHerdAnimals(farmId, herd.id)
            .then(animals => ({ herdId: herd.id, count: animals?.length || 0 }))
            .catch(() => ({ herdId: herd.id, count: 0 }))
        );

        const results = await Promise.all(countPromises);
        const counts = results.reduce((acc, { herdId, count }) => {
          acc[herdId] = count;
          return acc;
        }, {} as Record<string, number>);

        setAnimalCounts(counts);
      } catch (error) {
        console.error('Failed to load animal counts:', error);
      }
    };

    loadAnimalCounts();
  }, [herds, farmId]);

  const handleDeleteHerd = async (herdId: string) => {
    if (window.confirm('Are you sure you want to delete this herd?')) {
      await removeHerd(herdId);
    }
  };

  // Filter herds based on species
  const filteredHerds = useMemo(() => {
    if (!herds) return [];
    if (filterSpecies === 'all') return herds;
    return herds.filter(herd => herd.species_type === filterSpecies);
  }, [herds, filterSpecies]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Define columns
  const columns = useMemo<MRT_ColumnDef<Herd>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Herd Name',
        size: 200,
        Cell: ({ row }) => (
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: 'species_type',
        header: 'Species',
        size: 130,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-900 dark:text-white capitalize">
            {cell.getValue<string>()}
          </span>
        ),
        filterVariant: 'select',
      },
      {
        accessorKey: 'purpose',
        header: 'Purpose',
        size: 150,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
            {cell.getValue<string>() || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'location',
        header: 'Location',
        size: 150,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {cell.getValue<string>() || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'id',
        header: 'Animals',
        size: 100,
        Cell: ({ row }) => (
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {animalCounts[row.original.id] || 0}
          </span>
        ),
        enableColumnFilter: false,
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(cell.getValue<string>())}
          </span>
        ),
        enableColumnFilter: false,
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 150,
        enableColumnFilter: false,
        enableSorting: false,
        Cell: ({ row }) => (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setEditingHerd(row.original)}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteHerd(row.original.id)}
              className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [animalCounts]
  );

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Herds</h2>
        <Button
          onClick={() => setShowCreateModal(true)}
          size="sm"
          data-testid="create-herd-button"
        >
          Add Herd
        </Button>
      </div>

      {!isLoading && (!herds || herds.length === 0) ? (
        <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg text-gray-600 dark:text-gray-400 font-medium">No herds found</h3>
          <p className="text-gray-500 dark:text-gray-500 mt-2">
            Get started by creating your first herd
          </p>
        </div>
      ) : (
        <CustomMaterialTable
          columns={columns}
          data={filteredHerds}
          isLoading={isLoading}
          getRowId={(row) => row.id}
          enableRowSelection={false}
          renderTopToolbarCustomActions={() => (
            <div className="flex gap-2 items-center">
              <select
                value={filterSpecies}
                onChange={(e) => setFilterSpecies(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Species</option>
                <option value="cattle">Cattle</option>
                <option value="sheep">Sheep</option>
                <option value="goat">Goat</option>
                <option value="pig">Pig</option>
                <option value="chicken">Chicken</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}
        />
      )}

      {showCreateModal && (
        <CreateHerdModal
          farmId={farmId}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingHerd && (
        <EditHerdModal
          herd={editingHerd}
          onClose={() => setEditingHerd(null)}
        />
      )}
    </div>
  );
}

