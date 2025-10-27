'use client';

import React, { useState, useEffect } from 'react';
import { FarmInvitationResponse, INVITATION_STATUSES } from '@/types/farmMember';
import { FarmMemberService } from '@/services/farmMemberService';
import Button from '@/components/ui/button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card/Card';
import Badge from '@/components/ui/badge/Badge';
import { CheckCircleIcon, CloseIcon, TimeIcon, MailIcon, UserIcon, CalenderIcon } from '@/icons';
import { formatDate } from '@/utils/dateUtils';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationContext } from '@/providers/NotificationProvider';

const InvitationsPage: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotificationContext();
  const [invitations, setInvitations] = useState<FarmInvitationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null);

  const loadInvitations = async () => {
    if (!user?.email) {
      setError('User email not available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const invitationsData = await FarmMemberService.getUserInvitations(user.email);
      setInvitations(invitationsData);
    } catch (err: any) {
      console.error('Failed to load invitations:', err);
      setError(err.error || 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      setProcessingInvitation(invitationId);
      await FarmMemberService.acceptInvitation(invitationId);
      
      // Show success notification
      addNotification({
        type: 'success',
        title: 'Invitation Accepted!',
        message: 'You have successfully joined the farm. You can now access it from the farms page.'
      });
      
      await loadInvitations(); // Reload the list
    } catch (err: any) {
      console.error('Failed to accept invitation:', err);
      addNotification({
        type: 'error',
        title: 'Failed to Accept Invitation',
        message: err.error || 'Failed to accept invitation. Please try again.'
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
      await FarmMemberService.declineInvitation(invitationId);
      
      // Show success notification
      addNotification({
        type: 'info',
        title: 'Invitation Declined',
        message: 'You have declined the farm invitation.'
      });
      
      await loadInvitations(); // Reload the list
    } catch (err: any) {
      console.error('Failed to decline invitation:', err);
      addNotification({
        type: 'error',
        title: 'Failed to Decline Invitation',
        message: err.error || 'Failed to decline invitation. Please try again.'
      });
    } finally {
      setProcessingInvitation(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <TimeIcon className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'declined':
        return <CloseIcon className="h-4 w-4" />;
      case 'expired':
        return <CloseIcon className="h-4 w-4" />;
      default:
        return <TimeIcon className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'declined':
        return 'error';
      case 'expired':
        return 'light';
      default:
        return 'light';
    }
  };

  const isInvitationExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  useEffect(() => {
    loadInvitations();
  }, [user?.email]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="w-full">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Farm Invitations
          </h1>
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Loading invitations...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="w-full">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Farm Invitations
          </h1>
          <div className="text-center py-12">
            <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
            <Button onClick={loadInvitations} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="invitations-page">
      <div className="w-full">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Farm Invitations
        </h1>

        {invitations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MailIcon className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No invitations found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                You don't have any pending farm invitations at the moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <Card key={invitation.id} data-testid={`invitation-${invitation.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {invitation.farm_name}
                        </h3>
                        <Badge
                          color={getStatusColor(invitation.status) as any}
                          startIcon={getStatusIcon(invitation.status)}
                        >
                          {INVITATION_STATUSES[invitation.status as keyof typeof INVITATION_STATUSES] || invitation.status}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Role:</span>
                          <span className="capitalize">{invitation.role}</span>
                        </div>

                        {invitation.email && (
                          <div className="flex items-center gap-2">
                            <MailIcon className="h-4 w-4" />
                            <span>{invitation.email}</span>
                          </div>
                        )}

                        {invitation.phone && (
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            <span>{invitation.phone}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <CalenderIcon className="h-4 w-4" />
                          <span>Invited {formatDate(invitation.created_at)}</span>
                        </div>

                        {invitation.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <TimeIcon className="h-4 w-4" />
                            <span className={isInvitationExpired(invitation.expires_at) ? 'text-red-600' : ''}>
                              Expires {formatDate(invitation.expires_at)}
                              {isInvitationExpired(invitation.expires_at) && ' (Expired)'}
                            </span>
                          </div>
                        )}

                        {invitation.accepted_at && (
                          <div className="flex items-center gap-2">
                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                            <span>Accepted {formatDate(invitation.accepted_at)}</span>
                          </div>
                        )}

                        {invitation.declined_at && (
                          <div className="flex items-center gap-2">
                            <CloseIcon className="h-4 w-4 text-red-600" />
                            <span>Declined {formatDate(invitation.declined_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {invitation.status === 'pending' && !isInvitationExpired(invitation.expires_at) && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeclineInvitation(invitation.id)}
                          disabled={processingInvitation === invitation.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          data-testid={`decline-invitation-${invitation.id}`}
                        >
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAcceptInvitation(invitation.id)}
                          disabled={processingInvitation === invitation.id}
                          data-testid={`accept-invitation-${invitation.id}`}
                        >
                          {processingInvitation === invitation.id ? 'Processing...' : 'Accept'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitationsPage;
