import { createSlice, createAsyncThunk, isRejected } from '@reduxjs/toolkit';
import { CropState, CreateCropTypeData, CreateCropVarietyData, CreateGrowLocationData, CreatePlantingData, CreateHarvestData } from '@/types/crop';
import { CropTypeService } from '@/services/cropTypeService';
import { GrowLocationService } from '@/services/growLocationService';
import { PlantingService } from '@/services/plantingService';
import { HarvestService } from '@/services/harvestService';

const initialState: CropState = {
    cropTypes: [],
    varieties: [],
    locations: [],
    plantings: [],
    cycles: [],
    harvests: [],
    isLoading: false,
    error: null,
};

export const fetchCropTypes = createAsyncThunk(
    'crops/fetchCropTypes',
    async (farmId: string, { rejectWithValue }) => {
        try {
            return await CropTypeService.list(farmId);
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to load crop types');
        }
    }
);

export const createCropType = createAsyncThunk(
    'crops/createCropType',
    async ({ farmId, data }: { farmId: string; data: CreateCropTypeData }, { rejectWithValue }) => {
        try {
            return await CropTypeService.create(farmId, data);
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create crop type');
        }
    }
);

export const fetchVarieties = createAsyncThunk(
    'crops/fetchVarieties',
    async (cropTypeId: string, { rejectWithValue }) => {
        try {
            return await CropTypeService.listVarieties(cropTypeId);
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to load varieties');
        }
    }
);

export const createVariety = createAsyncThunk(
    'crops/createVariety',
    async (
        { cropTypeId, data }: { cropTypeId: string; data: CreateCropVarietyData },
        { rejectWithValue }
    ) => {
        try {
            return await CropTypeService.createVariety(cropTypeId, data);
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create variety');
        }
    }
);

export const fetchGrowLocations = createAsyncThunk(
    'crops/fetchGrowLocations',
    async (farmId: string, { rejectWithValue }) => {
        try {
            return await GrowLocationService.list(farmId);
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to load locations');
        }
    }
);

export const createGrowLocation = createAsyncThunk(
    'crops/createGrowLocation',
    async (
        { farmId, data }: { farmId: string; data: CreateGrowLocationData },
        { rejectWithValue }
    ) => {
        try {
            return await GrowLocationService.create(farmId, data);
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create location');
        }
    }
);

export const fetchPlantings = createAsyncThunk(
    'crops/fetchPlantings',
    async (farmId: string, { rejectWithValue }) => {
        try {
            return await PlantingService.list(farmId);
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to load plantings');
        }
    }
);

export const createPlanting = createAsyncThunk(
    'crops/createPlanting',
    async (
        { farmId, data }: { farmId: string; data: CreatePlantingData },
        { rejectWithValue }
    ) => {
        try {
            return await PlantingService.create(farmId, data);
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create planting');
        }
    }
);

export const fetchHarvests = createAsyncThunk(
    'crops/fetchHarvests',
    async (farmId: string, { rejectWithValue }) => {
        try {
            return await HarvestService.list(farmId);
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to load harvests');
        }
    }
);

export const createHarvest = createAsyncThunk(
    'crops/createHarvest',
    async (
        { farmId, data }: { farmId: string; data: CreateHarvestData },
        { rejectWithValue }
    ) => {
        try {
            return await HarvestService.create(farmId, data);
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to record harvest');
        }
    }
);

const cropSlice = createSlice({
    name: 'crops',
    initialState,
    reducers: {
        clearCropError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        const setPending = (state: CropState) => {
            state.isLoading = true;
            state.error = null;
        };
        const setRejected = (state: CropState, action: { payload: unknown }) => {
            state.isLoading = false;
            state.error = action.payload as string;
        };

        builder
            .addCase(fetchCropTypes.pending, setPending)
            .addCase(fetchCropTypes.fulfilled, (state, action) => {
                state.isLoading = false;
                state.cropTypes = action.payload;
            })
            .addCase(fetchCropTypes.rejected, setRejected)
            .addCase(createCropType.fulfilled, (state, action) => {
                state.cropTypes = [action.payload, ...state.cropTypes];
            })
            .addCase(fetchVarieties.fulfilled, (state, action) => {
                state.varieties = action.payload;
            })
            .addCase(createVariety.fulfilled, (state, action) => {
                state.varieties = [action.payload, ...state.varieties];
            })
            .addCase(fetchGrowLocations.pending, setPending)
            .addCase(fetchGrowLocations.fulfilled, (state, action) => {
                state.isLoading = false;
                state.locations = action.payload;
            })
            .addCase(fetchGrowLocations.rejected, setRejected)
            .addCase(createGrowLocation.fulfilled, (state, action) => {
                state.locations = [action.payload, ...state.locations];
            })
            .addCase(fetchPlantings.pending, setPending)
            .addCase(fetchPlantings.fulfilled, (state, action) => {
                state.isLoading = false;
                state.plantings = action.payload;
            })
            .addCase(fetchPlantings.rejected, setRejected)
            .addCase(createPlanting.fulfilled, (state, action) => {
                state.plantings = [action.payload, ...state.plantings];
            })
            .addCase(fetchHarvests.pending, setPending)
            .addCase(fetchHarvests.fulfilled, (state, action) => {
                state.isLoading = false;
                state.harvests = action.payload;
            })
            .addCase(fetchHarvests.rejected, setRejected)
            .addCase(createHarvest.fulfilled, (state, action) => {
                state.harvests = [action.payload, ...state.harvests];
            })
            // Every create rejected silently before this: the thunk passed the
            // message through rejectWithValue and nothing read it, so a failed
            // save looked exactly like a save that did nothing. That also hid
            // the database refusing a harvest inside a pre-harvest interval —
            // the one error the grower most needs to see.
            .addMatcher(
                isRejected(
                    createCropType,
                    createVariety,
                    createGrowLocation,
                    createPlanting,
                    createHarvest
                ),
                setRejected
            );
    },
});

export const { clearCropError } = cropSlice.actions;
export default cropSlice.reducer;
