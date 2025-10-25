import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { TokenManager } from '@/utils/tokenManager';
import { ApiResponse, ApiError } from '@/types/api';

// Create axios instance with default configuration
const createApiInstance = (): AxiosInstance => {
    const instance = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
        timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Request interceptor to add auth token
    instance.interceptors.request.use(
        (config) => {
            const token = TokenManager.getAccessToken();

            if (token && !TokenManager.isTokenExpired()) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Response interceptor to handle errors and token refresh
    instance.interceptors.response.use(
        (response: AxiosResponse) => {
            return response;
        },
        async (error: AxiosError) => {
            const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

            // Handle 401 Unauthorized
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;

                try {
                    // Attempt to refresh token
                    const refreshToken = TokenManager.getRefreshToken();
                    if (refreshToken) {
                        const response = await axios.post(
                            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/auth/refresh`,
                            { refreshToken }
                        );

                        const { accessToken, refreshToken: newRefreshToken } = response.data;

                        // Update tokens
                        TokenManager.setAccessToken(accessToken);
                        if (newRefreshToken) {
                            TokenManager.setRefreshToken(newRefreshToken);
                        }

                        // Retry original request with new token
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                        }
                        return instance(originalRequest);
                    }
                } catch (refreshError) {
                    // Refresh failed, clear tokens and redirect to login
                    TokenManager.clearTokens();
                    if (typeof window !== 'undefined') {
                        window.location.href = '/signin';
                    }
                }
            }

            // Handle other errors
            const axiosError = error as any; // Type assertion for axios error
            const apiError: ApiError = {
                message: axiosError.response?.data?.message || axiosError.message || 'An error occurred',
                statusCode: axiosError.response?.status || 500,
                error: axiosError.response?.data?.error,
                details: axiosError.response?.data,
            };

            return Promise.reject(apiError);
        }
    );

    return instance;
};

// Export the configured axios instance
export const apiClient = createApiInstance();

// Generic API methods
export const api = {
    get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
        apiClient.get(url, config).then(response => response.data),

    post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
        apiClient.post(url, data, config).then(response => response.data),

    put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
        apiClient.put(url, data, config).then(response => response.data),

    patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
        apiClient.patch(url, data, config).then(response => response.data),

    delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
        apiClient.delete(url, config).then(response => response.data),
};

// Utility function to handle API errors
export const handleApiError = (error: any): string => {
    if (error?.error) {
        return error.error;
    }

    if (error?.message) {
        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

    return 'An unexpected error occurred';
};

// Utility function to check if error is network error
export const isNetworkError = (error: any): boolean => {
    return !error.response && error.request;
};

// Utility function to check if error is timeout
export const isTimeoutError = (error: any): boolean => {
    return error.code === 'ECONNABORTED' || error.message?.includes('timeout');
};
