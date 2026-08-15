"use client";

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { initializeAuthSession } from '@/store/slices/authSlice';

interface ReduxProviderProps {
  children: React.ReactNode;
}

const ReduxClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    store.dispatch(initializeAuthSession());
  }, []);

  return <>{children}</>;
};

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
