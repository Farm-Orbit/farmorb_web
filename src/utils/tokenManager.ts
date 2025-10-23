import Cookies from 'js-cookie';
import { TokenPayload } from '@/types/auth';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

// Cookie options for secure storage
const COOKIE_OPTIONS = {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    expires: 7, // 7 days
};

const ACCESS_TOKEN_COOKIE_OPTIONS = {
    ...COOKIE_OPTIONS,
    expires: 1, // 1 day for access token
};

/**
 * Token Manager - Handles JWT token storage and retrieval
 */
export class TokenManager {
    /**
     * Set access token in both memory and cookie
     */
    static setAccessToken(token: string, expiresIn?: number): void {
        // Store in cookie for persistence
        Cookies.set(ACCESS_TOKEN_KEY, token, ACCESS_TOKEN_COOKIE_OPTIONS);

        // Store expiry time if provided
        if (expiresIn) {
            const expiryTime = Date.now() + (expiresIn * 1000);
            Cookies.set(TOKEN_EXPIRY_KEY, expiryTime.toString(), ACCESS_TOKEN_COOKIE_OPTIONS);
        }
    }

    /**
     * Set refresh token in secure cookie
     */
    static setRefreshToken(token: string): void {
        Cookies.set(REFRESH_TOKEN_KEY, token, COOKIE_OPTIONS);
    }

    /**
     * Get access token from cookie
     */
    static getAccessToken(): string | null {
        return Cookies.get(ACCESS_TOKEN_KEY) || null;
    }

    /**
     * Get refresh token from cookie
     */
    static getRefreshToken(): string | null {
        return Cookies.get(REFRESH_TOKEN_KEY) || null;
    }

    /**
     * Remove all tokens
     */
    static clearTokens(): void {
        Cookies.remove(ACCESS_TOKEN_KEY);
        Cookies.remove(REFRESH_TOKEN_KEY);
        Cookies.remove(TOKEN_EXPIRY_KEY);
    }

    /**
     * Check if access token is expired
     */
    static isTokenExpired(): boolean {
        const token = this.getAccessToken();
        if (!token) return true;

        try {
            // Check stored expiry time first
            const storedExpiry = Cookies.get(TOKEN_EXPIRY_KEY);
            if (storedExpiry) {
                const expiryTime = parseInt(storedExpiry, 10);
                if (Date.now() >= expiryTime) {
                    return true;
                }
            }

            // Fallback: decode token and check exp claim
            const payload = this.decodeToken(token);
            if (payload && payload.exp) {
                const currentTime = Math.floor(Date.now() / 1000);
                return currentTime >= payload.exp;
            }

            return false;
        } catch (error) {
            console.error('Error checking token expiry:', error);
            return true;
        }
    }

    /**
     * Decode JWT token payload
     */
    static decodeToken(token: string): TokenPayload | null {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }

    /**
     * Get user ID from token
     */
    static getUserIdFromToken(): string | null {
        const token = this.getAccessToken();
        if (!token) return null;

        const payload = this.decodeToken(token);
        return payload?.sub || null;
    }

    /**
     * Check if user has specific role
     */
    static hasRole(role: string): boolean {
        const token = this.getAccessToken();
        if (!token) return false;

        const payload = this.decodeToken(token);
        return payload?.role === role;
    }

    /**
     * Get token expiry time in milliseconds
     */
    static getTokenExpiryTime(): number | null {
        const storedExpiry = Cookies.get(TOKEN_EXPIRY_KEY);
        if (storedExpiry) {
            return parseInt(storedExpiry, 10);
        }

        const token = this.getAccessToken();
        if (!token) return null;

        const payload = this.decodeToken(token);
        return payload?.exp ? payload.exp * 1000 : null;
    }

    /**
     * Get time until token expires in seconds
     */
    static getTimeUntilExpiry(): number {
        const expiryTime = this.getTokenExpiryTime();
        if (!expiryTime) return 0;

        const timeUntilExpiry = Math.floor((expiryTime - Date.now()) / 1000);
        return Math.max(0, timeUntilExpiry);
    }
}
