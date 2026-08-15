"use client";

import React, { useEffect } from 'react';
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
  // Set once the initial Supabase session lookup has settled. On a hard page
  // load the store starts empty with isLoading false, so gating on isLoading
  // alone would bounce an authenticated user to /signin before the session
  // has been read back.
  const isSessionResolved = useAppSelector((state) => state.auth.isSessionResolved);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchCurrentUser().catch((error) => {
        console.error('Failed to fetch user data:', error);
      });
    }
  }, [isAuthenticated, user, fetchCurrentUser]);

  useEffect(() => {
    if (isSessionResolved && !isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isSessionResolved, isLoading, isAuthenticated, redirectTo, router]);

  if (isLoading || !isSessionResolved) {
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
