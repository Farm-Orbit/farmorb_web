"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAppSelector } from '@/store/hooks';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * AuthGuard component that protects routes and handles authentication state
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback,
  redirectTo = '/signin',
}) => {
  const { isAuthenticated, isLoading, user, fetchCurrentUser } = useAuth();
  const authLoading = useAppSelector((state) => state.auth.isLoading);
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        if (isAuthenticated && !user) {
          await fetchCurrentUser();
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        // Wait until first auth load attempt finishes
        if (!authLoading) {
          setIsInitialized(true);
        }
      }
    };

    initialize();
  }, [isAuthenticated, user, fetchCurrentUser, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      setIsInitialized(true);
    }
  }, [authLoading]);

  useEffect(() => {
    if (isInitialized && !isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isInitialized, isLoading, isAuthenticated, redirectTo, router]);

  if (isLoading || !isInitialized) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
