import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, LoginCredentials, RegisterData, AuthResponse } from '@/types/auth';
import { AuthService } from '@/services/authService';
import { TokenManager } from '@/utils/tokenManager';

// Initial state
const initialState: AuthState = {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    lastActivity: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
    'auth/login',
    async (credentials: LoginCredentials, { rejectWithValue }) => {
        try {
            const response = await AuthService.login(credentials);

            // Store tokens
            TokenManager.setAccessToken(response.accessToken, response.expiresIn);
            if (response.refreshToken) {
                TokenManager.setRefreshToken(response.refreshToken);
            }

            return response;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Login failed');
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/register',
    async (userData: RegisterData, { rejectWithValue }) => {
        try {
            const response = await AuthService.register(userData);

            // Store tokens
            TokenManager.setAccessToken(response.accessToken, response.expiresIn);
            if (response.refreshToken) {
                TokenManager.setRefreshToken(response.refreshToken);
            }

            return response;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Registration failed');
        }
    }
);

export const logoutUser = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await AuthService.logout();
        } catch (error: any) {
            // Even if logout fails on server, we should clear local state
            console.warn('Logout request failed:', error);
        } finally {
            // Always clear local tokens
            TokenManager.clearTokens();
        }
    }
);

export const refreshToken = createAsyncThunk(
    'auth/refreshToken',
    async (_, { rejectWithValue }) => {
        try {
            const response = await AuthService.refreshToken();

            // Update tokens
            TokenManager.setAccessToken(response.accessToken, response.expiresIn);
            if (response.refreshToken) {
                TokenManager.setRefreshToken(response.refreshToken);
            }

            return response;
        } catch (error: any) {
            // If refresh fails, clear tokens
            TokenManager.clearTokens();
            return rejectWithValue(error.message || 'Token refresh failed');
        }
    }
);

export const getCurrentUser = createAsyncThunk(
    'auth/getCurrentUser',
    async (_, { rejectWithValue }) => {
        try {
            const user = await AuthService.getCurrentUser();
            return user;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch user');
        }
    }
);

export const updateProfile = createAsyncThunk(
    'auth/updateProfile',
    async (userData: Partial<User>, { rejectWithValue }) => {
        try {
            const updatedUser = await AuthService.updateProfile(userData);
            return updatedUser;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Profile update failed');
        }
    }
);

// Auth slice
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            state.isAuthenticated = true;
        },
        setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken?: string }>) => {
            state.accessToken = action.payload.accessToken;
            state.refreshToken = action.payload.refreshToken;
            state.isAuthenticated = true;
        },
        clearAuth: (state) => {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            state.error = null;
            state.lastActivity = null;
        },
        updateLastActivity: (state) => {
            state.lastActivity = Date.now();
        },
        initializeAuth: (state) => {
            // Initialize auth state from stored tokens
            const accessToken = TokenManager.getAccessToken();
            const refreshToken = TokenManager.getRefreshToken();

            if (accessToken && !TokenManager.isTokenExpired()) {
                state.accessToken = accessToken;
                state.refreshToken = refreshToken;
                state.isAuthenticated = true;
                state.lastActivity = Date.now();
            } else {
                // Clear invalid tokens
                TokenManager.clearTokens();
                state.accessToken = null;
                state.refreshToken = null;
                state.isAuthenticated = false;
            }
        },
    },
    extraReducers: (builder) => {
        // Login
        builder
            .addCase(loginUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.accessToken = action.payload.accessToken;
                state.refreshToken = action.payload.refreshToken || null;
                state.isAuthenticated = true;
                state.error = null;
                state.lastActivity = Date.now();
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                state.isAuthenticated = false;
            });

        // Register
        builder
            .addCase(registerUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.accessToken = action.payload.accessToken;
                state.refreshToken = action.payload.refreshToken || null;
                state.isAuthenticated = true;
                state.error = null;
                state.lastActivity = Date.now();
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                state.isAuthenticated = false;
            });

        // Logout
        builder
            .addCase(logoutUser.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.isLoading = false;
                state.user = null;
                state.accessToken = null;
                state.refreshToken = null;
                state.isAuthenticated = false;
                state.error = null;
                state.lastActivity = null;
            })
            .addCase(logoutUser.rejected, (state) => {
                state.isLoading = false;
                // Still clear auth state even if logout request failed
                state.user = null;
                state.accessToken = null;
                state.refreshToken = null;
                state.isAuthenticated = false;
                state.error = null;
                state.lastActivity = null;
            });

        // Refresh token
        builder
            .addCase(refreshToken.fulfilled, (state, action) => {
                state.accessToken = action.payload.accessToken;
                state.refreshToken = action.payload.refreshToken || state.refreshToken;
                state.isAuthenticated = true;
                state.lastActivity = Date.now();
            })
            .addCase(refreshToken.rejected, (state) => {
                state.user = null;
                state.accessToken = null;
                state.refreshToken = null;
                state.isAuthenticated = false;
                state.error = null;
                state.lastActivity = null;
            });

        // Get current user
        builder
            .addCase(getCurrentUser.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getCurrentUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(getCurrentUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                // Don't clear auth state on user fetch failure
            });

        // Update profile
        builder
            .addCase(updateProfile.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload;
                state.error = null;
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const {
    clearError,
    setUser,
    setTokens,
    clearAuth,
    updateLastActivity,
    initializeAuth,
} = authSlice.actions;

export default authSlice.reducer;
