'use client';

import React, { useState } from 'react';
import { InviteMemberRequest } from '../../types/farmMember';
import { FarmMemberService } from '../../services/farmMemberService';
import Button from '../ui/button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card/Card';
import { Input } from '../ui/input/Input';
import { Label } from '../ui/label/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select/Select';
import { CloseIcon, PlusIcon, MailIcon, UserIcon } from '../../icons';

interface InviteMemberFormProps {
  farmId: string;
  farmName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const InviteMemberForm: React.FC<InviteMemberFormProps> = ({
  farmId,
  farmName,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<InviteMemberRequest>({
    email: '',
    phone: '',
    role: 'member',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof InviteMemberRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value || undefined,
    }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.email && !formData.phone) {
      setError('Please provide either an email address or phone number');
      return false;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.phone && !/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/\s/g, ''))) {
      setError('Please enter a valid phone number');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Clean up the data - remove empty strings
      const cleanData: InviteMemberRequest = {
        role: formData.role,
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
      };

      await FarmMemberService.inviteMember(farmId, cleanData);
      
      // Reset form
      setFormData({
        email: '',
        phone: '',
        role: 'member',
      });
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to invite member:', err);
      setError(err.error || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4" data-testid="invite-member-form">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PlusIcon className="h-5 w-5" />
              Invite Member to {farmName}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <CloseIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <MailIcon className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="member@example.com"
                data-testid="invite-email-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1234567890"
                data-testid="invite-phone-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange('role', value)}
              >
                <SelectTrigger data-testid="invite-role-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Provide either an email address or phone number (or both).</p>
              <p>The invited person will receive an invitation to join this farm.</p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading}
                data-testid="invite-submit-button"
              >
                {loading ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
