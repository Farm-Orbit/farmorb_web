'use client';

import React, { createContext, useContext } from 'react';
import { useNotification, Notification } from '@/hooks/useNotification';
import NotificationContainer from '@/components/ui/notification/NotificationContainer';

interface NotificationContextType {
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { notifications, addNotification, removeNotification, clearAllNotifications } = useNotification();

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification, clearAllNotifications }}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
};
