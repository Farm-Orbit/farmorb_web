import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { FarmState, Farm, CreateFarmData, UpdateFarmData } from '@/types/farm';
import { FarmService } from '@/services/farmService';

const initialState: FarmState = {
    farms: [],
    currentFarm: null,
    isLoading: false,
    error: null,
};

// Async Thunks
export const fetchFarms = createAsyncThunk(
    'farms/fetchFarms',
    async (_, { rejectWithValue }) => {
        try {
            const response = await FarmService.getFarms();
            return response;
        } catch (error: any) {
            return rejectWithValue(error.error || error.message || 'Failed to fetch farms');
        }
    }
);

export const fetchFarmById = createAsyncThunk(
    'farms/fetchFarmById',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await FarmService.getFarmById(id);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.error || error.message || 'Failed to fetch farm details');
        }
    }
);

export const createFarm = createAsyncThunk(
    'farms/createFarm',
    async (farmData: CreateFarmData, { rejectWithValue }) => {
        try {
            const response = await FarmService.createFarm(farmData);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.error || error.message || 'Failed to create farm');
        }
    }
);

export const updateFarm = createAsyncThunk(
    'farms/updateFarm',
    async ({ id, data }: { id: string; data: UpdateFarmData }, { rejectWithValue }) => {
        try {
            const response = await FarmService.updateFarm(id, data);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.error || error.message || 'Failed to update farm');
        }
    }
);

export const deleteFarm = createAsyncThunk(
    'farms/deleteFarm',
    async (id: string, { rejectWithValue }) => {
        try {
            await FarmService.deleteFarm(id);
            return id; // Return the ID of the deleted farm
        } catch (error: any) {
            return rejectWithValue(error.error || error.message || 'Failed to delete farm');
        }
    }
);

const farmSlice = createSlice({
    name: 'farms',
    initialState,
    reducers: {
        clearFarmError: (state) => {
            state.error = null;
        },
        setCurrentFarm: (state, action: PayloadAction<Farm | null>) => {
            state.currentFarm = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Farms
            .addCase(fetchFarms.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchFarms.fulfilled, (state, action) => {
                state.isLoading = false;
                state.farms = action.payload.farms || [];
            })
            .addCase(fetchFarms.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Fetch Farm By Id
            .addCase(fetchFarmById.pending, (state) => {
                state.isLoading = true;
                state.error = null;
                state.currentFarm = null;
            })
            .addCase(fetchFarmById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentFarm = action.payload;
            })
            .addCase(fetchFarmById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Create Farm
            .addCase(createFarm.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createFarm.fulfilled, (state, action) => {
                state.isLoading = false;
                if (state.farms) {
                    state.farms.push(action.payload); // Add new farm to the list
                } else {
                    state.farms = [action.payload];
                }
            })
            .addCase(createFarm.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Update Farm
            .addCase(updateFarm.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateFarm.fulfilled, (state, action) => {
                state.isLoading = false;
                if (state.farms) {
                    const index = state.farms.findIndex((f) => f.id === action.payload.id);
                    if (index !== -1) {
                        state.farms[index] = action.payload;
                    }
                }
                if (state.currentFarm?.id === action.payload.id) {
                    state.currentFarm = action.payload;
                }
            })
            .addCase(updateFarm.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Delete Farm
            .addCase(deleteFarm.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteFarm.fulfilled, (state, action) => {
                state.isLoading = false;
                if (state.farms) {
                    state.farms = state.farms.filter((farm) => farm.id !== action.payload);
                }
                if (state.currentFarm?.id === action.payload) {
                    state.currentFarm = null;
                }
            })
            .addCase(deleteFarm.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearFarmError, setCurrentFarm } = farmSlice.actions;
export default farmSlice.reducer;