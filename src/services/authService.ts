import { api } from './api';
import {
    LoginCredentials,
    RegisterData,
    AuthResponse,
    User,
    RefreshTokenResponse
} from '@/types/auth';
import {
    LoginRequest,
    RegisterRequest,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest
} from '@/types/api';

/**
 * Authentication Service - Handles all auth-related API calls
 */
export class AuthService {
    /**
     * Login user with email and password
     */
    static async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const loginData: LoginRequest = {
            email: credentials.email,
            password: credentials.password,
        };

        const response = await api.post<AuthResponse>('/auth/login', loginData);
        return response.data;
    }

    /**
     * Register new user
     */
    static async register(userData: RegisterData): Promise<AuthResponse> {
        const registerData: RegisterRequest = {
            email: userData.email,
            password: userData.password,
            firstName: userData.firstName,
            lastName: userData.lastName,
        };

        const response = await api.post<AuthResponse>('/auth/register', registerData);
        return response.data;
    }

    /**
     * Logout user
     */
    static async logout(): Promise<void> {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            // Even if logout fails on server, we should clear local tokens
            console.warn('Logout request failed:', error);
        }
    }

    /**
     * Refresh access token
     */
    static async refreshToken(): Promise<RefreshTokenResponse> {
        const response = await api.post<RefreshTokenResponse>('/auth/refresh');
        return response.data;
    }

    /**
     * Get current user profile
     */
    static async getCurrentUser(): Promise<User> {
        const response = await api.get<User>('/auth/me');
        return response.data;
    }

    /**
     * Update user profile
     */
    static async updateProfile(userData: Partial<User>): Promise<User> {
        const response = await api.put<User>('/auth/profile', userData);
        return response.data;
    }

    /**
     * Change password
     */
    static async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
        await api.post('/auth/change-password', passwordData);
    }

    /**
     * Request password reset
     */
    static async forgotPassword(email: string): Promise<void> {
        const requestData: ForgotPasswordRequest = { email };
        await api.post('/auth/forgot-password', requestData);
    }

    /**
     * Reset password with token
     */
    static async resetPassword(resetData: ResetPasswordRequest): Promise<void> {
        await api.post('/auth/reset-password', resetData);
    }

    /**
     * Verify email address
     */
    static async verifyEmail(token: string): Promise<void> {
        await api.post('/auth/verify-email', { token });
    }

    /**
     * Resend email verification
     */
    static async resendVerificationEmail(): Promise<void> {
        await api.post('/auth/resend-verification');
    }

    /**
     * Delete user account
     */
    static async deleteAccount(): Promise<void> {
        await api.delete('/auth/account');
    }

    /**
     * Get user activity/logs
     */
    static async getUserActivity(): Promise<any[]> {
        const response = await api.get<any[]>('/auth/activity');
        return response.data;
    }

    /**
     * Check if email is available
     */
    static async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
        const response = await api.get<{ available: boolean }>(`/auth/check-email?email=${encodeURIComponent(email)}`);
        return response.data;
    }

    /**
     * Social login (Google, etc.)
     */
    static async socialLogin(provider: string, token: string): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>(`/auth/social/${provider}`, { token });
        return response.data;
    }

    /**
     * Link social account
     */
    static async linkSocialAccount(provider: string, token: string): Promise<void> {
        await api.post(`/auth/social/${provider}/link`, { token });
    }

    /**
     * Unlink social account
     */
    static async unlinkSocialAccount(provider: string): Promise<void> {
        await api.delete(`/auth/social/${provider}/link`);
    }
}
