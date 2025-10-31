'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useNotificationContext } from '@/providers/NotificationProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card/Card';
import Button from '@/components/ui/button/Button';
import { Input } from '@/components/ui/input/Input';
import { Label } from '@/components/ui/label/Label';
import { FarmMemberService } from '@/services/farmMemberService';
import { ArrowRightIcon, PlusIcon } from '@/icons';

export default function InviteMemberPage() {
  const router = useRouter();
  const params = useParams();
  const farmId = params.id as string;
  const { addNotification } = useNotificationContext();

  const [formData, setFormData] = useState({
    email: '',
    role: 'member' as 'member',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Email is required'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await FarmMemberService.inviteMember(farmId, { email: formData.email, role: formData.role });
      
      // Clear the form
      setFormData({ email: '', role: 'member' });
      
      // Show success notification
      addNotification({
        type: 'success',
        title: 'Invitation Sent!',
        message: `Invitation sent successfully.`
      });
      
      // Redirect immediately to farm page
      router.push(`/farms/${farmId}`);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Invitation Failed',
        message: error.error || 'Failed to send invitation. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/farms/${farmId}`)}
            data-testid="back-to-farm-button"
          >
            <ArrowRightIcon className="h-4 w-4 mr-2" />
            Back to Farm
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Invite Member</h1>
            <p className="text-gray-600 dark:text-gray-400">Send an invitation to join this farm</p>
          </div>
        </div>

        {/* Invite Form */}
        <Card data-testid="invite-member-form">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusIcon className="h-5 w-5" />
              Invite New Member
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  data-testid="invite-email-input"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  data-testid="invite-role-select"
                >
                  <option value="member">Member</option>
                </select>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="invite-submit-button"
                >
                  {isSubmitting ? 'Sending...' : 'Send Invitation'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/farms/${farmId}`)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
