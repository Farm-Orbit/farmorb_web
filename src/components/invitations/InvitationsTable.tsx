"use client";

import React, { useEffect, useMemo, useState } from 'react';
import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { FarmInvitationResponse, INVITATION_STATUSES } from '@/types/farmMember';
import { useFarmMembers } from '@/hooks/useFarmMembers';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationContext } from '@/providers/NotificationProvider';
import Button from '@/components/ui/button/Button';

interface InvitationsTableProps {}

export default function InvitationsTable({}: InvitationsTableProps) {
  const { user } = useAuth();
  const { addNotification } = useNotificationContext();
  const { invitations, isLoading, error, getMyInvitations, acceptInvitation, declineInvitation } = useFarmMembers();
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (user?.email) {
      getMyInvitations(user.email);
    }
  }, [user?.email, getMyInvitations]);

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      setProcessingInvitation(invitationId);
      await acceptInvitation(invitationId);
      
      addNotification({
        type: 'success',
        title: 'Invitation Accepted!',
        message: 'You have successfully joined the farm. You can now access it from the farms page.'
      });
      
      if (user?.email) {
        await getMyInvitations(user.email);
      }
    } catch (err: any) {
      console.error('Failed to accept invitation:', err);
      addNotification({
        type: 'error',
        title: 'Failed to Accept Invitation',
        message: err?.message || 'Failed to accept invitation. Please try again.'
      });
    } finally {
      setProcessingInvitation(null);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    if (!window.confirm('Are you sure you want to decline this invitation?')) {
      return;
    }

    try {
      setProcessingInvitation(invitationId);
      await declineInvitation(invitationId);
      
      addNotification({
        type: 'info',
        title: 'Invitation Declined',
        message: 'You have declined the farm invitation.'
      });
      
      if (user?.email) {
        await getMyInvitations(user.email);
      }
    } catch (err: any) {
      console.error('Failed to decline invitation:', err);
      addNotification({
        type: 'error',
        title: 'Failed to Decline Invitation',
        message: err?.message || 'Failed to decline invitation. Please try again.'
      });
    } finally {
      setProcessingInvitation(null);
    }
  };

  const isInvitationExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

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
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'declined':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'expired':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Filter invitations based on status
  const filteredInvitations = useMemo(() => {
    if (filterStatus === 'all') return invitations;
    return invitations.filter(invitation => invitation.status === filterStatus);
  }, [invitations, filterStatus]);

  // Define columns
  const columns = useMemo<MRT_ColumnDef<FarmInvitationResponse>[]>(
    () => [
      {
        accessorKey: 'farm_name',
        header: 'Farm Name',
        size: 200,
        Cell: ({ cell }) => (
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {cell.getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Role',
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-900 dark:text-white capitalize">
            {cell.getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 130,
        Cell: ({ cell }) => {
          const status = cell.getValue<string>();
          return (
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
              {INVITATION_STATUSES[status as keyof typeof INVITATION_STATUSES] || status}
            </span>
          );
        },
        filterVariant: 'select',
        filterSelectOptions: Object.entries(INVITATION_STATUSES).map(([value, label]) => ({
          value,
          label,
        })),
      },
      {
        accessorKey: 'created_at',
        header: 'Invited',
        size: 130,
        Cell: ({ cell }) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(cell.getValue<string>())}
          </span>
        ),
        enableColumnFilter: false,
      },
      {
        accessorKey: 'expires_at',
        header: 'Expires',
        size: 130,
        Cell: ({ row }) => {
          const expiresAt = row.original.expires_at;
          const isExpired = isInvitationExpired(expiresAt);
          return (
            <span className={`text-sm ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
              {formatDate(expiresAt)}
              {isExpired && ' (Expired)'}
            </span>
          );
        },
        enableColumnFilter: false,
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 150,
        enableColumnFilter: false,
        enableSorting: false,
        Cell: ({ row }) => {
          const invitation = row.original;
          const isPending = invitation.status === 'pending';
          const isExpired = isInvitationExpired(invitation.expires_at);
          const canAct = isPending && !isExpired;

          if (!canAct) {
            return (
              <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
            );
          }

          const isProcessing = processingInvitation === invitation.id;

          return (
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handleDeclineInvitation(invitation.id)}
                disabled={isProcessing}
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                data-testid={`decline-invitation-${invitation.id}`}
              >
                Decline
              </button>
              <button
                onClick={() => handleAcceptInvitation(invitation.id)}
                disabled={isProcessing}
                className="text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                data-testid={`accept-invitation-${invitation.id}`}
              >
                {isProcessing ? 'Processing...' : 'Accept'}
              </button>
            </div>
          );
        },
      },
    ],
    [processingInvitation]
  );

  return (
    <div className="space-y-4" data-testid="invitations-page">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => user?.email && getMyInvitations(user.email)}
            className="mt-2 text-sm text-red-700 dark:text-red-300 underline"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Farm Invitations</h2>
      </div>

      {!isLoading && invitations.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg text-gray-600 dark:text-gray-400 font-medium">No invitations found</h3>
          <p className="text-gray-500 dark:text-gray-500 mt-2">
            You don't have any pending farm invitations at the moment.
          </p>
        </div>
      ) : (
        <CustomMaterialTable
          columns={columns}
          data={filteredInvitations}
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
                {Object.entries(INVITATION_STATUSES).map(([value, label]) => (
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

