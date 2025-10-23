// API-related TypeScript types

export interface ApiResponse<T = any> {
    data: T;
    message?: string;
    success: boolean;
    statusCode: number;
}

export interface ApiError {
    message: string;
    statusCode: number;
    error?: string;
    details?: any;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ApiRequestConfig {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}

// Common API endpoints structure
export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
    confirmPassword: string;
}
