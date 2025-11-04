'use client';

import { useFarmMembers } from '@/hooks/useFarmMembers';
import { formatDate } from '@/utils/dateUtils';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { GroupIcon, PlusIcon, TrashBinIcon } from '../../icons';
import { FARM_ROLES, FarmMemberResponse } from '../../types/farmMember';
import Badge from '../ui/badge/Badge';
import Button from '../ui/button/Button';
import { Card, CardContent } from '../ui/card/Card';

interface FarmMembersListProps {
  farmId: string;
  isOwner: boolean;
  onInviteMember: () => void;
}

export const FarmMembersList: React.FC<FarmMembersListProps> = ({
  farmId,
  isOwner,
  onInviteMember,
}) => {
  const router = useRouter();
  const { members, isLoading: loading, error, getFarmMembers, deleteMember } = useFarmMembers();
  const [removingMember, setRemovingMember] = useState<string | null>(null);

  useEffect(() => {
    if (farmId) {
      getFarmMembers(farmId);
    }
  }, [farmId, getFarmMembers]);

  const handleRemoveMember = async (member: FarmMemberResponse) => {
    if (!window.confirm('Are you sure you want to remove this member from the farm?')) {
      return;
    }

    try {
      setRemovingMember(member.id);
      await deleteMember(farmId, member.user_id);
      await getFarmMembers(farmId);
    } catch (err: any) {
      console.error('Failed to remove member:', err);
      alert(err?.message || 'Failed to remove member');
    } finally {
      setRemovingMember(null);
    }
  };

  const getMemberDisplayName = (member: FarmMemberResponse) => {
    if (member.first_name && member.last_name) {
      return `${member.first_name} ${member.last_name}`;
    }
    if (member.first_name) {
      return member.first_name;
    }
    if (member.email) {
      return member.email;
    }
    if (member.phone) {
      return member.phone;
    }
    return 'Unknown Member';
  };

  const getMemberContact = (member: FarmMemberResponse) => {
    const display = getMemberDisplayName(member);
    const showEmail = member.email && display !== member.email; // avoid showing email twice
    const showPhone = Boolean(member.phone);
    if (showEmail && showPhone) return `${member.email} • ${member.phone}`;
    if (showEmail) return member.email as string;
    if (showPhone) return member.phone as string;
    return 'No contact info';
  };

  if (loading) {
    return (
      <Card data-testid="farm-members-section">
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500 dark:text-gray-400">Loading members...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card data-testid="farm-members-section">
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
            <Button onClick={() => getFarmMembers(farmId)} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="farm-members-section">
      <CardContent>
        <div className="flex items-center justify-end mb-4">
          {isOwner && (
            <Button onClick={() => router.push(`/farms/${farmId}/invite`)} size="sm" className="flex items-center gap-2" data-testid="invite-member-button">
              <PlusIcon className="h-4 w-4" />
              Invite Member
            </Button>
          )}
        </div>
        {members.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <GroupIcon className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p>No members found</p>
            {isOwner && (
              <p className="text-sm mt-2 text-gray-400 dark:text-gray-500">Invite members to collaborate on this farm</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="grid grid-cols-[1fr_auto] items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                data-testid={`farm-member-${member.id}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 dark:text-blue-400 font-medium text-xs">
                      {getMemberDisplayName(member).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {getMemberDisplayName(member)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {getMemberContact(member)}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={member.role === 'owner' ? 'solid' : 'light'}
                        color={member.role === 'owner' ? 'primary' : 'info'}
                        size="sm"
                      >
                        {FARM_ROLES[member.role as keyof typeof FARM_ROLES] || member.role}
                      </Badge>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        Joined {formatDate(member.joined_at)}
                      </span>
                    </div>
                  </div>
                </div>
                {isOwner && member.role !== 'owner' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveMember(member)}
                    disabled={removingMember === member.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    data-testid={`remove-member-${member.id}`}
                  >
                    <TrashBinIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
