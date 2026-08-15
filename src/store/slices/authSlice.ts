import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, LoginCredentials, RegisterData } from '@/types/auth';
import { AuthService } from '@/services/authService';

const initialState: AuthState = {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    lastActivity: null,
};

export const loginUser = createAsyncThunk(
    'auth/login',
    async (credentials: LoginCredentials, { rejectWithValue }) => {
        try {
            return await AuthService.login(credentials);
        } catch (error: any) {
            return rejectWithValue(error.message || 'Login failed');
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/register',
    async (userData: RegisterData, { rejectWithValue }) => {
        try {
            return await AuthService.register(userData);
        } catch (error: any) {
            return rejectWithValue(error.message || 'Registration failed');
        }
    }
);

export const logoutUser = createAsyncThunk(
    'auth/logout',
    async () => {
        try {
            await AuthService.logout();
        } catch (error: any) {
            console.warn('Logout request failed:', error);
        }
    }
);

export const refreshToken = createAsyncThunk(
    'auth/refreshToken',
    async (_, { rejectWithValue }) => {
        try {
            return await AuthService.refreshToken();
        } catch (error: any) {
            return rejectWithValue(error.message || 'Token refresh failed');
        }
    }
);

export const getCurrentUser = createAsyncThunk(
    'auth/getCurrentUser',
    async (_, { rejectWithValue }) => {
        try {
            return await AuthService.getCurrentUser();
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch user');
        }
    }
);

export const updateProfile = createAsyncThunk(
    'auth/updateProfile',
    async (userData: Partial<User>, { rejectWithValue }) => {
        try {
            return await AuthService.updateProfile(userData);
        } catch (error: any) {
            return rejectWithValue(error.message || 'Profile update failed');
        }
    }
);

export const initializeAuthSession = createAsyncThunk(
    'auth/initializeAuthSession',
    async (_, { rejectWithValue }) => {
        try {
            const session = await AuthService.getSession();
            if (!session?.user) {
                return null;
            }
            const user = await AuthService.getCurrentUser();
            return {
                user,
                accessToken: session.access_token,
                refreshToken: session.refresh_token,
            };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to initialize auth');
        }
    }
);

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
        /** @deprecated Prefer initializeAuthSession — kept for ReduxProvider compatibility */
        initializeAuth: () => {
            // No-op: session is loaded asynchronously via initializeAuthSession
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.accessToken = action.payload.accessToken || null;
                state.refreshToken = action.payload.refreshToken || null;
                state.isAuthenticated = !!action.payload.accessToken;
                state.error = null;
                state.lastActivity = Date.now();
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                state.isAuthenticated = false;
            });

        builder
            .addCase(registerUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.accessToken = action.payload.accessToken || null;
                state.refreshToken = action.payload.refreshToken || null;
                state.isAuthenticated = !!action.payload.accessToken;
                state.error = null;
                state.lastActivity = Date.now();
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                state.isAuthenticated = false;
            });

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
                state.user = null;
                state.accessToken = null;
                state.refreshToken = null;
                state.isAuthenticated = false;
                state.error = null;
                state.lastActivity = null;
            });

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
            });

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

        builder
            .addCase(initializeAuthSession.fulfilled, (state, action) => {
                if (action.payload) {
                    state.user = action.payload.user;
                    state.accessToken = action.payload.accessToken;
                    state.refreshToken = action.payload.refreshToken;
                    state.isAuthenticated = true;
                    state.lastActivity = Date.now();
                } else {
                    state.user = null;
                    state.accessToken = null;
                    state.refreshToken = null;
                    state.isAuthenticated = false;
                }
            })
            .addCase(initializeAuthSession.rejected, (state) => {
                state.user = null;
                state.accessToken = null;
                state.refreshToken = null;
                state.isAuthenticated = false;
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
