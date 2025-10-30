"use client";

import { useState, useEffect } from 'react';
import { useHerds } from '@/hooks/useHerds';
import { Herd } from '@/types/herd';
import HerdCard from './HerdCard';
import CreateHerdModal from './CreateHerdModal';
import EditHerdModal from './EditHerdModal';
import Button from '@/components/ui/button/Button';
import { useNotificationContext } from '@/providers/NotificationProvider';

interface HerdListProps {
  farmId: string;
}

export default function HerdList({ farmId }: HerdListProps) {
  const { herds, isLoading, error, getFarmHerds, addHerd, editHerd, removeHerd } = useHerds();
  const { addNotification } = useNotificationContext();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingHerd, setEditingHerd] = useState<Herd | null>(null);
  const [expandedHerdId, setExpandedHerdId] = useState<string | null>(null);

  useEffect(() => {
    if (farmId) {
      getFarmHerds(farmId);
    }
  }, [farmId, getFarmHerds]);

  const handleCreateHerd = async (data: any) => {
    try {
      await addHerd(farmId, data);
      addNotification({
        type: 'success',
        title: 'Herd Created',
        message: 'Herd has been created successfully',
      });
      setIsCreateModalOpen(false);
      // Refresh the list
      getFarmHerds(farmId);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error || 'Failed to create herd',
      });
    }
  };

  const handleEditHerd = async (herdId: string, data: any) => {
    try {
      await editHerd(farmId, herdId, data);
      addNotification({
        type: 'success',
        title: 'Herd Updated',
        message: 'Herd has been updated successfully',
      });
      setEditingHerd(null);
      // Refresh the list
      getFarmHerds(farmId);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error || 'Failed to update herd',
      });
    }
  };

  const handleDeleteHerd = async (herdId: string) => {
    if (!confirm('Are you sure you want to delete this herd? This will also delete all animals in the herd.')) {
      return;
    }

    try {
      await removeHerd(farmId, herdId);
      addNotification({
        type: 'success',
        title: 'Herd Deleted',
        message: 'Herd has been deleted successfully',
      });
      // Refresh the list
      getFarmHerds(farmId);
      // Clear expanded state if deleted herd was expanded
      if (expandedHerdId === herdId) {
        setExpandedHerdId(null);
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error || 'Failed to delete herd',
      });
    }
  };

  const toggleHerdExpansion = (herdId: string) => {
    setExpandedHerdId(expandedHerdId === herdId ? null : herdId);
  };

  return (
    <div className="space-y-4" data-testid="herds-section">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Herds</h2>
        <Button onClick={() => setIsCreateModalOpen(true)} data-testid="create-herd-button">
          Create New Herd
        </Button>
      </div>

      {isLoading && <p className="text-center text-gray-500 dark:text-gray-400">Loading herds...</p>}
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {!isLoading && !error && herds && herds.length === 0 && (
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg text-gray-600 dark:text-gray-400">No herds found</h3>
          <p className="text-gray-500 dark:text-gray-500 mt-2">
            Get started by creating your first herd
          </p>
          <Button 
            onClick={() => setIsCreateModalOpen(true)} 
            className="mt-4"
            data-testid="create-first-herd-button"
          >
            Create Your First Herd
          </Button>
        </div>
      )}

      {!isLoading && herds && herds.length > 0 && (
        <div className="space-y-4">
          {herds.map((herd) => (
            <HerdCard
              key={herd.id}
              herd={herd}
              farmId={farmId}
              isExpanded={expandedHerdId === herd.id}
              onToggleExpand={() => toggleHerdExpansion(herd.id)}
              onEdit={() => setEditingHerd(herd)}
              onDelete={() => handleDeleteHerd(herd.id)}
            />
          ))}
        </div>
      )}

      {/* Create Herd Modal */}
      {isCreateModalOpen && (
        <CreateHerdModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateHerd}
        />
      )}

      {/* Edit Herd Modal */}
      {editingHerd && (
        <EditHerdModal
          isOpen={!!editingHerd}
          onClose={() => setEditingHerd(null)}
          onSubmit={(data) => handleEditHerd(editingHerd.id, data)}
          herd={editingHerd}
        />
      )}
    </div>
  );
}

