"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFarms } from '@/hooks/useFarms';
import Button from '@/components/ui/button/Button';
import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { Farm } from '@/types/farm';

interface FarmListProps {
  // Removed onEditFarm and onDeleteFarm as actions are now on farm detail page
}

const farmTypeLabels: Record<string, string> = {
  crop: 'Crop',
  livestock: 'Livestock',
  mixed: 'Mixed',
  dairy: 'Dairy',
  poultry: 'Poultry',
  other: 'Other',
};

export default function FarmList({}: FarmListProps) {
  const router = useRouter();
  const {
    farms,
    isLoading,
    error,
    getFarms,
  } = useFarms();

  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    getFarms();
  }, [getFarms]);

  // Filter farms based on type
  const filteredFarms = useMemo(() => {
    if (!farms) return [];
    if (filterType === 'all') return farms;
    return farms.filter(farm => farm.farm_type === filterType);
  }, [farms, filterType]);

  const handleFarmClick = (farm: Farm) => {
    router.push(`/farms/${farm.id}`);
  };

  // Define columns
  const columns = useMemo<MRT_ColumnDef<Farm>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Farm',
        size: 200,
        Cell: ({ row }) => (
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {row.original.name || 'Unnamed Farm'}
          </span>
        ),
      },
      {
        accessorKey: 'location_address',
        header: 'Location',
        size: 250,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {cell.getValue<string>() || 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'farm_type',
        header: 'Type',
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-900 dark:text-white">
            {farmTypeLabels[cell.getValue<string>()] || cell.getValue<string>()}
          </span>
        ),
        filterVariant: 'select',
        filterSelectOptions: Object.entries(farmTypeLabels).map(([value, label]) => ({
          value,
          label,
        })),
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        size: 120,
        Cell: ({ cell }) => {
          const isActive = cell.getValue<boolean>();
          return (
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
              isActive 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
            }`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          );
        },
        filterVariant: 'checkbox',
      },
      {
        accessorFn: (row) => {
          if (row.size_acres) return `${row.size_acres} acres`;
          if (row.size_hectares) return `${row.size_hectares} ha`;
          return 'N/A';
        },
        header: 'Size',
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {cell.getValue<string>()}
          </span>
        ),
        enableColumnFilter: false,
      },
    ],
    []
  );

  return (
    <div className="space-y-4" data-testid="farms-page">
             {/* Header */}
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Farms</h2>
        <Button 
          onClick={() => router.push('/farms/create')} 
          data-testid="create-farm-button"
          size="sm"
        >
          Add Farm
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800 mb-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Material React Table */}
      {!isLoading && (!farms || farms.length === 0) ? (
        <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg text-gray-600 dark:text-gray-400 font-medium">No farms found</h3>
          <p className="text-gray-500 dark:text-gray-500 mt-2">
            Get started by creating your first farm
          </p>
        </div>
      ) : (
        <CustomMaterialTable
          columns={columns}
          data={filteredFarms}
          isLoading={isLoading}
          onRowClick={handleFarmClick}
          getRowId={(row) => row.id}
          renderTopToolbarCustomActions={() => (
            <div className="flex gap-2 items-center">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                {Object.entries(farmTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          )}
        />
      )}
    </div>
  );
}