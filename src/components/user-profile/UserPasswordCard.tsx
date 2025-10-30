"use client";
import React, { useState } from "react";
import { useModal } from "../../hooks/useModal";
import { useNotificationContext } from "../../providers/NotificationProvider";
import { AuthService } from "../../services/authService";
import { ChangePasswordRequest } from "../../types/auth";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";

export default function UserPasswordCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { addNotification } = useNotificationContext();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string>('');
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleCloseModal = () => {
    setFormError('');
    setErrors({});
    closeModal();
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

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.current_password) {
      newErrors.current_password = 'Current password is required';
    }

    if (!formData.new_password) {
      newErrors.new_password = 'New password is required';
    } else if (formData.new_password.length < 8) {
      newErrors.new_password = 'Password must be at least 8 characters long';
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your new password';
    } else if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    if (formData.current_password === formData.new_password) {
      newErrors.new_password = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    // Clear previous form error
    setFormError('');
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const passwordData: ChangePasswordRequest = {
        current_password: formData.current_password,
        new_password: formData.new_password,
      };

      await AuthService.changePassword(passwordData);
      
      // Reset form
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      
      // Show success notification before closing modal
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Password changed successfully!'
      });
      
      // Close modal after showing notification
      handleCloseModal();
    } catch (error: any) {
      console.error('Error changing password:', error);
      
      // Set form-level error to display in the form - prioritize error.error from API
      const errorMessage = error?.error || error?.message || 'Failed to change password. Please try again.';
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

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Password & Security
          </h4>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Password
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                ••••••••
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Last Updated
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          data-testid="change-password-button"
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
          Change Password
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={handleCloseModal} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90" data-testid="change-password-modal-title">
              Change Password
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Enter your current password and choose a new password.
            </p>
          </div>
          <form className="flex flex-col">
            {formError && (
              <div className="mx-2 mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
              </div>
            )}
            <div className="px-2 pb-3">
              <div className="space-y-5">
                <div>
                  <Label>Current Password</Label>
                  <Input 
                    type="password" 
                    name="current_password"
                    value={formData.current_password}
                    onChange={handleInputChange}
                    data-testid="current-password-input"
                    className={errors.current_password ? 'border-red-500' : ''}
                  />
                  {errors.current_password && (
                    <p className="mt-1 text-xs text-red-500">{errors.current_password}</p>
                  )}
                </div>

                <div>
                  <Label>New Password</Label>
                  <Input 
                    type="password" 
                    name="new_password"
                    value={formData.new_password}
                    onChange={handleInputChange}
                    data-testid="new-password-input"
                    className={errors.new_password ? 'border-red-500' : ''}
                  />
                  {errors.new_password && (
                    <p className="mt-1 text-xs text-red-500">{errors.new_password}</p>
                  )}
                </div>

                <div>
                  <Label>Confirm New Password</Label>
                  <Input 
                    type="password" 
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                    data-testid="confirm-password-input"
                    className={errors.confirm_password ? 'border-red-500' : ''}
                  />
                  {errors.confirm_password && (
                    <p className="mt-1 text-xs text-red-500">{errors.confirm_password}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={handleCloseModal} disabled={isLoading} data-testid="cancel-password-button">
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={isLoading}
                data-testid="save-password-button"
              >
                {isLoading ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
