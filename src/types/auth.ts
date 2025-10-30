// Auth-related TypeScript types

export interface User {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    auth_type?: string;
    avatar?: string;
    role?: string;
    isEmailVerified?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface RegisterData {
    email: string;
    password: string;
    confirmPassword: string;
    firstName?: string;
    lastName?: string;
    acceptTerms?: boolean;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
}

export interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    lastActivity: number | null;
}

export interface TokenPayload {
    sub: string; // user id
    email: string;
    role?: string;
    iat: number;
    exp: number;
}

export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
}

export interface UpdateUserRequest {
    first_name?: string;
    last_name?: string;
}

export interface ChangePasswordRequest {
    current_password: string;
    new_password: string;
}

export interface UpdateEmailRequest {
    new_email: string;
}

export interface DeleteUserRequest {
    password: string;
}
