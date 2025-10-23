import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    loginUser,
    registerUser,
    logoutUser,
    getCurrentUser,
    updateProfile,
    clearError
} from '@/store/slices/authSlice';
import { LoginCredentials, RegisterData, User } from '@/types/auth';

/**
 * Custom hook for authentication functionality
 * Provides easy access to auth state and actions
 */
export const useAuth = () => {
    const dispatch = useAppDispatch();
    const authState = useAppSelector((state) => state.auth);

    // Auth state
    const {
        user,
        isAuthenticated,
        isLoading,
        error,
        accessToken,
        refreshToken,
    } = authState;

    // Auth actions
    const login = useCallback(async (credentials: LoginCredentials) => {
        return dispatch(loginUser(credentials));
    }, [dispatch]);

    const register = useCallback(async (userData: RegisterData) => {
        return dispatch(registerUser(userData));
    }, [dispatch]);

    const logout = useCallback(async () => {
        return dispatch(logoutUser());
    }, [dispatch]);

    const fetchCurrentUser = useCallback(async () => {
        return dispatch(getCurrentUser());
    }, [dispatch]);

    const updateUserProfile = useCallback(async (userData: Partial<User>) => {
        return dispatch(updateProfile(userData));
    }, [dispatch]);

    const clearAuthError = useCallback(() => {
        dispatch(clearError());
    }, [dispatch]);

    // Computed values
    const isLoggedIn = isAuthenticated && !!user;
    const hasToken = !!accessToken;
    const userRole = user?.role;
    const userId = user?.id;

    // Helper functions
    const hasRole = useCallback((role: string) => {
        return userRole === role;
    }, [userRole]);

    const isAdmin = useCallback(() => {
        return hasRole('admin') || hasRole('super_admin');
    }, [hasRole]);

    const isUser = useCallback(() => {
        return hasRole('user') || hasRole('member');
    }, [hasRole]);

    return {
        // State
        user,
        isAuthenticated,
        isLoading,
        error,
        accessToken,
        refreshToken,

        // Computed
        isLoggedIn,
        hasToken,
        userRole,
        userId,

        // Actions
        login,
        register,
        logout,
        fetchCurrentUser,
        updateUserProfile,
        clearAuthError,

        // Helpers
        hasRole,
        isAdmin,
        isUser,
    };
};

export default useAuth;
