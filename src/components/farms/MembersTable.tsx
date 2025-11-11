"use client";

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import {
  type MRT_ColumnDef,
  type MRT_PaginationState,
  type MRT_SortingState,
  type MRT_ColumnFiltersState,
  type MRT_TableOptions,
} from 'material-react-table';
import { FarmMemberResponse, FARM_ROLES } from '@/types/farmMember';
import { useFarmMembers } from '@/hooks/useFarmMembers';
import Button from '@/components/ui/button/Button';
import { ListOptions } from '@/types/list';
import { buildListOptions } from '@/utils/listOptions';

interface MembersTableProps {
  farmId: string;
}

const sortColumnMap: Record<string, string> = {
  first_name: 'first_name',
  email: 'email',
  phone: 'phone',
  role: 'role',
  joined_at: 'joined_at',
};

const filterColumnMap: Record<string, string> = {
  first_name: 'first_name',
  email: 'email',
  phone: 'phone',
  role: 'role',
};

export default function MembersTable({ farmId }: MembersTableProps) {
  const router = useRouter();
  const {
    members,
    isLoading,
    error,
    getFarmMembers,
    updateMemberRole,
    deleteMember,
  } = useFarmMembers();
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [editingMember, setEditingMember] = useState<FarmMemberResponse | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [paginationState, setPaginationState] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sortingState, setSortingState] = useState<MRT_SortingState>([]);
  const [columnFiltersState, setColumnFiltersState] = useState<MRT_ColumnFiltersState>([]);
  const [totalCount, setTotalCount] = useState(0);

  const buildMemberParams = useCallback((): ListOptions => {
    return buildListOptions({
      paginationState,
      sortingState,
      columnFiltersState,
      sortColumnMap,
      filterColumnMap,
      extraFilters: {
        role: filterRole === 'all' ? undefined : filterRole,
      },
    });
  }, [paginationState, sortingState, columnFiltersState, filterRole]);

  useEffect(() => {
    if (!farmId) {
      return;
    }

    const params = buildMemberParams();
    getFarmMembers(farmId, params)
      .then((result) => {
        setTotalCount(result.total ?? result.items.length);
        setPaginationState((prev) => {
          const nextPageIndex = Math.max((result.page ?? params.page ?? 1) - 1, 0);
          const nextPageSize = result.pageSize ?? params.pageSize ?? prev.pageSize;
          if (prev.pageIndex === nextPageIndex && prev.pageSize === nextPageSize) {
            return prev;
          }
          return {
            pageIndex: nextPageIndex,
            pageSize: nextPageSize,
          };
        });
      })
      .catch(() => {
        setTotalCount(0);
      });
  }, [farmId, buildMemberParams, getFarmMembers]);

  const handleRemoveMember = useCallback(async (member: FarmMemberResponse) => {
    if (!window.confirm('Are you sure you want to remove this member from the farm?')) {
      return;
    }

    try {
      setRemovingMember(member.id);
      await deleteMember(farmId, member.user_id);
      const result = await getFarmMembers(farmId, buildMemberParams());
      setTotalCount(result.total ?? result.items.length);
    } catch (err: any) {
      console.error('Failed to remove member:', err);
      alert(err?.message || 'Failed to remove member');
    } finally {
      setRemovingMember(null);
    }
  }, [farmId, deleteMember, getFarmMembers, buildMemberParams]);

  const handleUpdateRole = useCallback(async (member: FarmMemberResponse, newRole: string) => {
    if (newRole === member.role) {
      setEditingMember(null);
      return;
    }

    try {
      setUpdatingRole(member.id);
      await updateMemberRole(farmId, member.user_id, newRole);
      const result = await getFarmMembers(farmId, buildMemberParams());
      setTotalCount(result.total ?? result.items.length);
      setEditingMember(null);
    } catch (err: any) {
      console.error('Failed to update member role:', err);
      alert(err?.message || 'Failed to update member role');
    } finally {
      setUpdatingRole(null);
    }
  }, [farmId, updateMemberRole, getFarmMembers, buildMemberParams]);

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
          const canEdit = member.role !== 'owner';

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
                    className="text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
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
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    data-testid={`edit-member-${member.id}`}
                  >
                    Edit Role
                  </button>
                  <button
                    onClick={() => handleRemoveMember(member)}
                    disabled={isRemoving}
                    className="text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
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
    ], [editingMember, handleRemoveMember, handleUpdateRole, removingMember, updatingRole]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => getFarmMembers(farmId, buildMemberParams())}
            className="mt-2 text-sm text-red-700 dark:text-red-300 underline"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="flex justify-end items-center">
        <Button
          onClick={() => router.push(`/farms/${farmId}/invite`)}
          size="sm"
          data-testid="invite-member-button"
        >
          Invite Member
        </Button>
      </div>

      {!isLoading && members.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No members found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Invite members to collaborate on this farm
          </p>
        </div>
      ) : (
        <CustomMaterialTable
          columns={columns}
          data={members}
          isLoading={isLoading}
          getRowId={(row) => row.id}
          enableRowSelection={false}
          enableColumnFilters
          enableGlobalFilter={false}
          initialPageSize={paginationState.pageSize}
          renderTopToolbarCustomActions={() => (
            <div className="flex gap-2 items-center">
              <select
                value={filterRole}
                onChange={(e) => {
                  setFilterRole(e.target.value);
                  setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
                }}
                data-testid="member-role-filter"
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
          additionalTableOptions={{
            manualPagination: true,
            manualSorting: true,
            manualFiltering: true,
            rowCount: totalCount,
            onPaginationChange: setPaginationState,
            onSortingChange: setSortingState,
            onColumnFiltersChange: setColumnFiltersState,
            state: {
              pagination: paginationState,
              sorting: sortingState,
              columnFilters: columnFiltersState,
              isLoading,
            },
          } as Partial<MRT_TableOptions<FarmMemberResponse>>}
        />
      )}
    </div>
  );
}

