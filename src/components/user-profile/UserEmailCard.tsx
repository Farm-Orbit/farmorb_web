"use client";
import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNotificationContext } from "../../providers/NotificationProvider";
import { AuthService } from "../../services/authService";
import { UpdateEmailRequest } from "../../types/auth";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";

export default function UserEmailCard() {
  const { user } = useAuth();
  const { addNotification } = useNotificationContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState<string>('');
  const [formData, setFormData] = useState({
    new_email: '',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const resetForm = () => {
    setFormError('');
    setErrors({});
    setFormData({ new_email: '' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear form error when user starts typing
    if (formError) {
      setFormError('');
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.new_email) {
      newErrors.new_email = 'New email is required';
    } else if (!validateEmail(formData.new_email)) {
      newErrors.new_email = 'Please enter a valid email address';
    } else if (formData.new_email === user?.email) {
      newErrors.new_email = 'New email must be different from current email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateEmail = async () => {
    // Clear previous form error
    setFormError('');
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const emailData: UpdateEmailRequest = {
        new_email: formData.new_email,
      };

      await AuthService.updateEmail(emailData);
      
      resetForm();
      
      // Show success notification before closing modal
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Verification email sent to your new email address. Please check your inbox and follow the instructions.'
      });
      
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating email:', error);
      
      // Set form-level error to display in the form - prioritize error.error from API
      const errorMessage = error?.error || error?.message || 'Failed to update email. Please try again.';
      setFormError(errorMessage);
      
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;

    setIsLoading(true);
    try {
      await AuthService.sendEmailVerification(user.email);
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Verification email sent! Please check your inbox.'
      });
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: error?.response?.data?.error || 'Failed to send verification email. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500 dark:text-gray-400">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Email Management
          </h4>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Current Email
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user.email}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Email Status
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.isEmailVerified
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}
                >
                  {user.isEmailVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row">
          {!user.isEmailVerified && (
            <button
              onClick={handleResendVerification}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-blue-300 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 shadow-theme-xs hover:bg-blue-100 hover:text-blue-800 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300 lg:inline-flex lg:w-auto"
              data-testid="resend-verification-button"
            >
              <svg
                className="fill-current"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 1.5C5.25 1.5 2.25 4.5 2.25 8.25C2.25 9.75 2.625 11.25 3.375 12.375L1.5 14.25V9H3.75C3.75 6.375 6 4.125 8.625 4.125C11.25 4.125 13.5 6.375 13.5 8.25C13.5 10.125 11.25 12.375 8.625 12.375C7.5 12.375 6.375 11.625 5.625 10.5L4.125 12C5.25 13.5 6.875 14.25 8.625 14.25C12.375 14.25 15.375 11.25 15.375 8.25C15.375 4.5 12.375 1.5 9 1.5Z"
                  fill=""
                />
              </svg>
              Resend Verification
            </button>
          )}

          <button
            onClick={() => {
              resetForm();
              setIsEditing((prev) => !prev);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
            data-testid="change-email-button"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
            {isEditing ? 'Close Form' : 'Change Email'}
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="mt-6 space-y-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/40 lg:p-6">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {formError}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-1">
              <Label>Current Email</Label>
              <Input type="email" value={user.email} disabled className="bg-gray-100 dark:bg-gray-800" />
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <Label>New Email Address</Label>
              <Input
                type="email"
                name="new_email"
                value={formData.new_email}
                onChange={handleInputChange}
                placeholder="Enter your new email address"
                data-testid="new-email-input"
                className={errors.new_email ? 'border-red-500' : ''}
              />
              {errors.new_email && <p className="mt-1 text-xs text-red-500">{errors.new_email}</p>}
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
            <strong>Note:</strong> After submitting, you'll receive a verification email at your new address. You must click the verification link to complete the email change process.
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                resetForm();
                setIsEditing(false);
              }}
              disabled={isLoading}
              data-testid="cancel-email-button"
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUpdateEmail}
              disabled={isLoading}
              data-testid="save-email-button"
              className="w-full sm:w-auto"
            >
              {isLoading ? 'Sending...' : 'Send Verification Email'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
