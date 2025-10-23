"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * AuthGuard component that protects routes and handles authentication state
 * Can be easily tested and reused across different layouts
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback,
  redirectTo = '/signin' 
}) => {
  const { isAuthenticated, isLoading, user, fetchCurrentUser } = useAuth();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // If we have a token but no user data, fetch it
        if (isAuthenticated && !user) {
          await fetchCurrentUser();
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        // If fetching user data fails, the auth state will be cleared automatically
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [isAuthenticated, user, fetchCurrentUser]);

  // Show loading state while checking authentication
  if (isLoading || !isInitialized) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to signin if not authenticated
  if (!isAuthenticated) {
    router.push(redirectTo);
    return null;
  }

  // Show protected content if authenticated
  return <>{children}</>;
};

export default AuthGuard;
