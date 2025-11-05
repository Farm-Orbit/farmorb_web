"use client";

import React, { useEffect, useMemo, useState } from 'react';
import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { Group } from '@/types/group';
import Button from '@/components/ui/button/Button';
import CreateGroupModal from './CreateGroupModal';
import EditGroupModal from './EditGroupModal';
import { GroupService } from '@/services/groupService';

interface GroupsTableProps {
  farmId: string;
}

export default function GroupsTable({ farmId }: GroupsTableProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [animalCounts, setAnimalCounts] = useState<Record<string, number>>({});

  const loadGroups = async () => {
    if (!farmId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await GroupService.getFarmGroups(farmId);
      setGroups(data);
    } catch (err: any) {
      console.error('Failed to load groups:', err);
      setError(err.error || err.message || 'Failed to load groups');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [farmId]);

  // Load animal counts for each group
  useEffect(() => {
    const loadAnimalCounts = async () => {
      if (!groups || groups.length === 0) return;

      try {
        const countPromises = groups.map(group =>
          GroupService.getGroupAnimals(group.id)
            .then(animals => ({ groupId: group.id, count: animals?.length || 0 }))
            .catch(() => ({ groupId: group.id, count: 0 }))
        );

        const results = await Promise.all(countPromises);
        const counts = results.reduce((acc, { groupId, count }) => {
          acc[groupId] = count;
          return acc;
        }, {} as Record<string, number>);

        setAnimalCounts(counts);
      } catch (error) {
        console.error('Failed to load animal counts:', error);
      }
    };

    loadAnimalCounts();
  }, [groups]);

  const handleDeleteGroup = async (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      try {
        await GroupService.deleteGroup(farmId, groupId);
        await loadGroups();
      } catch (err: any) {
        console.error('Failed to delete group:', err);
        setError(err.error || err.message || 'Failed to delete group');
      }
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    loadGroups();
  };

  const handleEditSuccess = () => {
    setEditingGroup(null);
    loadGroups();
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Define columns
  const columns = useMemo<MRT_ColumnDef<Group>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Group Name',
        size: 200,
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.color && (
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: row.original.color }}
              />
            )}
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {row.original.name}
            </span>
          </div>
        ),
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
        accessorKey: 'description',
        header: 'Description',
        size: 200,
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
              onClick={() => setEditingGroup(row.original)}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteGroup(row.original.id)}
              className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [animalCounts, farmId]
  );

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex justify-end items-center">
        <Button
          onClick={() => setShowCreateModal(true)}
          size="sm"
          data-testid="create-group-button"
        >
          Add Group
        </Button>
      </div>

      {!isLoading && (!groups || groups.length === 0) ? (
        <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No groups found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Get started by creating your first group
          </p>
        </div>
      ) : (
        <CustomMaterialTable
          columns={columns}
          data={groups}
          isLoading={isLoading}
          getRowId={(row) => row.id}
          enableRowSelection={false}
        />
      )}

      {showCreateModal && (
        <CreateGroupModal
          farmId={farmId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {editingGroup && (
        <EditGroupModal
          group={editingGroup}
          onClose={() => setEditingGroup(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}

