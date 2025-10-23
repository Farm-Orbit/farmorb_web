// API Endpoints Documentation
// Based on Swagger docs at http://localhost:8080/swagger/index.html

/**
 * Authentication Endpoints
 * Base URL: http://localhost:8080/api
 */

// POST /auth/login
export interface LoginEndpoint {
    method: 'POST';
    path: '/auth/login';
    request: {
        email: string;
        password: string;
    };
    response: {
        user: {
            id: string;
            email: string;
            firstName?: string;
            lastName?: string;
            role?: string;
            isEmailVerified?: boolean;
        };
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    };
}

// POST /auth/register
export interface RegisterEndpoint {
    method: 'POST';
    path: '/auth/register';
    request: {
        email: string;
        password: string;
        firstName?: string;
        lastName?: string;
    };
    response: {
        user: {
            id: string;
            email: string;
            firstName?: string;
            lastName?: string;
            role?: string;
            isEmailVerified?: boolean;
        };
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    };
}

// POST /auth/logout
export interface LogoutEndpoint {
    method: 'POST';
    path: '/auth/logout';
    request: {};
    response: {
        message: string;
    };
}

// POST /auth/refresh
export interface RefreshTokenEndpoint {
    method: 'POST';
    path: '/auth/refresh';
    request: {
        refreshToken: string;
    };
    response: {
        accessToken: string;
        refreshToken?: string;
        expiresIn: number;
    };
}

// GET /auth/me
export interface GetCurrentUserEndpoint {
    method: 'GET';
    path: '/auth/me';
    request: {};
    response: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        avatar?: string;
        role?: string;
        isEmailVerified?: boolean;
        createdAt: string;
        updatedAt: string;
    };
}

// PUT /auth/profile
export interface UpdateProfileEndpoint {
    method: 'PUT';
    path: '/auth/profile';
    request: {
        firstName?: string;
        lastName?: string;
        avatar?: string;
    };
    response: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        avatar?: string;
        role?: string;
        isEmailVerified?: boolean;
        createdAt: string;
        updatedAt: string;
    };
}

// POST /auth/change-password
export interface ChangePasswordEndpoint {
    method: 'POST';
    path: '/auth/change-password';
    request: {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    };
    response: {
        message: string;
    };
}

// POST /auth/forgot-password
export interface ForgotPasswordEndpoint {
    method: 'POST';
    path: '/auth/forgot-password';
    request: {
        email: string;
    };
    response: {
        message: string;
    };
}

// POST /auth/reset-password
export interface ResetPasswordEndpoint {
    method: 'POST';
    path: '/auth/reset-password';
    request: {
        token: string;
        newPassword: string;
        confirmPassword: string;
    };
    response: {
        message: string;
    };
}

// POST /auth/verify-email
export interface VerifyEmailEndpoint {
    method: 'POST';
    path: '/auth/verify-email';
    request: {
        token: string;
    };
    response: {
        message: string;
    };
}

// POST /auth/resend-verification
export interface ResendVerificationEndpoint {
    method: 'POST';
    path: '/auth/resend-verification';
    request: {};
    response: {
        message: string;
    };
}

// DELETE /auth/account
export interface DeleteAccountEndpoint {
    method: 'DELETE';
    path: '/auth/account';
    request: {};
    response: {
        message: string;
    };
}

// GET /auth/activity
export interface GetUserActivityEndpoint {
    method: 'GET';
    path: '/auth/activity';
    request: {};
    response: Array<{
        id: string;
        action: string;
        timestamp: string;
        ipAddress?: string;
        userAgent?: string;
    }>;
}

// GET /auth/check-email
export interface CheckEmailEndpoint {
    method: 'GET';
    path: '/auth/check-email';
    request: {
        email: string;
    };
    response: {
        available: boolean;
    };
}

// Social Authentication Endpoints
// POST /auth/social/{provider}
export interface SocialLoginEndpoint {
    method: 'POST';
    path: '/auth/social/{provider}';
    request: {
        token: string;
    };
    response: {
        user: {
            id: string;
            email: string;
            firstName?: string;
            lastName?: string;
            role?: string;
            isEmailVerified?: boolean;
        };
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    };
}

// POST /auth/social/{provider}/link
export interface LinkSocialAccountEndpoint {
    method: 'POST';
    path: '/auth/social/{provider}/link';
    request: {
        token: string;
    };
    response: {
        message: string;
    };
}

// DELETE /auth/social/{provider}/link
export interface UnlinkSocialAccountEndpoint {
    method: 'DELETE';
    path: '/auth/social/{provider}/link';
    request: {};
    response: {
        message: string;
    };
}

/**
 * Common Response Format
 */
export interface ApiResponse<T = any> {
    data: T;
    message?: string;
    success: boolean;
    statusCode: number;
}

/**
 * Error Response Format
 */
export interface ApiErrorResponse {
    message: string;
    statusCode: number;
    error?: string;
    details?: any;
}

/**
 * Supported Social Providers
 */
export type SocialProvider = 'google' | 'facebook' | 'twitter' | 'github' | 'linkedin';

/**
 * User Roles
 */
export type UserRole = 'admin' | 'user' | 'moderator' | 'super_admin';
