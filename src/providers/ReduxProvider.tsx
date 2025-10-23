"use client";

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store, AppDispatch } from '@/store';
import { initializeAuth } from '@/store/slices/authSlice';

interface ReduxProviderProps {
  children: React.ReactNode;
}

// Client component to handle Redux store initialization
const ReduxClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Initialize auth state from stored tokens on app load
    store.dispatch(initializeAuth());
  }, []);

  return <>{children}</>;
};

// Main Redux Provider component
export const ReduxProvider: React.FC<ReduxProviderProps> = ({ children }) => {
  return (
    <Provider store={store}>
      <ReduxClientProvider>
        {children}
      </ReduxClientProvider>
    </Provider>
  );
};

export default ReduxProvider;
