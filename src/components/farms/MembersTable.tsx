"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { FarmMemberResponse, FARM_ROLES } from '@/types/farmMember';
import { FarmMemberService } from '@/services/farmMemberService';
import Button from '@/components/ui/button/Button';

interface MembersTableProps {
  farmId: string;
  isOwner: boolean;
}

export default function MembersTable({ farmId, isOwner }: MembersTableProps) {
  const router = useRouter();
  const [members, setMembers] = useState<FarmMemberResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [editingMember, setEditingMember] = useState<FarmMemberResponse | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  const loadMembers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const membersData = await FarmMemberService.getFarmMembers(farmId);
      setMembers(membersData);
    } catch (err: any) {
      console.error('Failed to load farm members:', err);
      setError(err.error || 'Failed to load farm members');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (farmId) {
      loadMembers();
    }
  }, [farmId]);

  const handleRemoveMember = async (member: FarmMemberResponse) => {
    if (!window.confirm('Are you sure you want to remove this member from the farm?')) {
      return;
    }

    try {
      setRemovingMember(member.id);
      await FarmMemberService.removeFarmMember(farmId, member.user_id);
      await loadMembers();
    } catch (err: any) {
      console.error('Failed to remove member:', err);
      alert(err.error || 'Failed to remove member');
    } finally {
      setRemovingMember(null);
    }
  };

  const handleUpdateRole = async (member: FarmMemberResponse, newRole: string) => {
    if (newRole === member.role) {
      setEditingMember(null);
      return;
    }

    try {
      setUpdatingRole(member.id);
      await FarmMemberService.updateFarmMember(farmId, member.user_id, { role: newRole });
      await loadMembers();
      setEditingMember(null);
    } catch (err: any) {
      console.error('Failed to update member role:', err);
      alert(err.error || 'Failed to update member role');
    } finally {
      setUpdatingRole(null);
    }
  };

  const getMemberDisplayName = (member: FarmMemberResponse) => {
    if (member.first_name && member.last_name) {
      return `${member.first_name} ${member.last_name}`;
    }
    if (member.first_name) {
      return member.first_name;
    }
    if (member.last_name) {
      return member.last_name;
    }
    // Don't return email or phone here to avoid duplication in the table
    return 'Member';
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Filter members based on role
  const filteredMembers = useMemo(() => {
    if (filterRole === 'all') return members;
    return members.filter(member => member.role === filterRole);
  }, [members, filterRole]);

  // Define columns
  const columns = useMemo<MRT_ColumnDef<FarmMemberResponse>[]>(
    () => [
      {
        accessorKey: 'first_name',
        header: 'Name',
        size: 200,
        Cell: ({ row }) => {
          const name = getMemberDisplayName(row.original);
          return (
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {name}
            </span>
          );
        },
      },
      {
        accessorKey: 'email',
        header: 'Email',
        size: 220,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {cell.getValue<string>() || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        size: 150,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {cell.getValue<string>() || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Role',
        size: 130,
        Cell: ({ cell }) => {
          const role = cell.getValue<string>();
          const isOwnerRole = role === 'owner';
          return (
            <span
              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                isOwnerRole
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
              }`}
            >
              {FARM_ROLES[role as keyof typeof FARM_ROLES] || role}
            </span>
          );
        },
        filterVariant: 'select',
        filterSelectOptions: Object.entries(FARM_ROLES).map(([value, label]) => ({
          value,
          label,
        })),
      },
      {
        accessorKey: 'joined_at',
        header: 'Joined',
        size: 130,
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
        Cell: ({ row }) => {
          const member = row.original;
          const canEdit = isOwner && member.role !== 'owner';
          
          if (!canEdit) {
            return (
              <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
            );
          }

          const isEditing = editingMember?.id === member.id;
          const isUpdating = updatingRole === member.id;
          const isRemoving = removingMember === member.id;

          return (
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              {isEditing ? (
                <>
                  <select
                    value={member.role}
                    onChange={(e) => handleUpdateRole(member, e.target.value)}
                    disabled={isUpdating}
                    className="text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white"
                    data-testid={`role-select-${member.id}`}
                  >
                    <option value="manager">Manager</option>
                    <option value="worker">Worker</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    onClick={() => setEditingMember(null)}
                    disabled={isUpdating}
                    className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditingMember(member)}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    data-testid={`edit-member-${member.id}`}
                  >
                    Edit Role
                  </button>
                  <button
                    onClick={() => handleRemoveMember(member)}
                    disabled={isRemoving}
                    className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                    data-testid={`remove-member-${member.id}`}
                  >
                    {isRemoving ? 'Removing...' : 'Remove'}
                  </button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [isOwner, removingMember, editingMember, updatingRole]
  );

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={loadMembers}
            className="mt-2 text-sm text-red-700 dark:text-red-300 underline"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Team Members</h2>
        {isOwner && (
          <Button
            onClick={() => router.push(`/farms/${farmId}/invite`)}
            size="sm"
            data-testid="invite-member-button"
          >
            Invite Member
          </Button>
        )}
      </div>

      {!isLoading && members.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg text-gray-600 dark:text-gray-400 font-medium">No members found</h3>
          <p className="text-gray-500 dark:text-gray-500 mt-2">
            {isOwner ? 'Invite members to collaborate on this farm' : 'No team members yet'}
          </p>
        </div>
      ) : (
        <CustomMaterialTable
          columns={columns}
          data={filteredMembers}
          isLoading={isLoading}
          getRowId={(row) => row.id}
          enableRowSelection={false}
          renderTopToolbarCustomActions={() => (
            <div className="flex gap-2 items-center">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                {Object.entries(FARM_ROLES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}
        />
      )}
    </div>
  );
}

