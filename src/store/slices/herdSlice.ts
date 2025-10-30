import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { HerdService } from '@/services/herdService';
import { Herd, CreateHerdData } from '@/types/herd';

interface HerdState {
  herds: Herd[];
  currentHerd: Herd | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: HerdState = {
  herds: [],
  currentHerd: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchFarmHerds = createAsyncThunk(
  'herds/fetchFarmHerds',
  async (farmId: string, { rejectWithValue }) => {
    try {
      const herds = await HerdService.getFarmHerds(farmId);
      return herds;
    } catch (error: any) {
      return rejectWithValue(error.error || 'Failed to fetch herds');
    }
  }
);

export const fetchHerdById = createAsyncThunk(
  'herds/fetchHerdById',
  async ({ farmId, herdId }: { farmId: string; herdId: string }, { rejectWithValue }) => {
    try {
      const herd = await HerdService.getHerdById(farmId, herdId);
      return herd;
    } catch (error: any) {
      return rejectWithValue(error.error || 'Failed to fetch herd');
    }
  }
);

export const createHerd = createAsyncThunk(
  'herds/createHerd',
  async ({ farmId, data }: { farmId: string; data: CreateHerdData }, { rejectWithValue }) => {
    try {
      const herd = await HerdService.createHerd(farmId, data);
      return herd;
    } catch (error: any) {
      return rejectWithValue(error.error || 'Failed to create herd');
    }
  }
);

export const updateHerd = createAsyncThunk(
  'herds/updateHerd',
  async ({ farmId, herdId, data }: { farmId: string; herdId: string; data: Partial<CreateHerdData> }, { rejectWithValue }) => {
    try {
      const herd = await HerdService.updateHerd(farmId, herdId, data);
      return herd;
    } catch (error: any) {
      return rejectWithValue(error.error || 'Failed to update herd');
    }
  }
);

export const deleteHerd = createAsyncThunk(
  'herds/deleteHerd',
  async ({ farmId, herdId }: { farmId: string; herdId: string }, { rejectWithValue }) => {
    try {
      await HerdService.deleteHerd(farmId, herdId);
      return herdId;
    } catch (error: any) {
      return rejectWithValue(error.error || 'Failed to delete herd');
    }
  }
);

const herdSlice = createSlice({
  name: 'herds',
  initialState,
  reducers: {
    clearHerdError: (state) => {
      state.error = null;
    },
    setCurrentHerd: (state, action: PayloadAction<Herd | null>) => {
      state.currentHerd = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch farm herds
      .addCase(fetchFarmHerds.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFarmHerds.fulfilled, (state, action) => {
        state.isLoading = false;
        state.herds = action.payload;
      })
      .addCase(fetchFarmHerds.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch herd by ID
      .addCase(fetchHerdById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHerdById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentHerd = action.payload;
      })
      .addCase(fetchHerdById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create herd
      .addCase(createHerd.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createHerd.fulfilled, (state, action) => {
        state.isLoading = false;
        state.herds.push(action.payload);
      })
      .addCase(createHerd.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update herd
      .addCase(updateHerd.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateHerd.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.herds.findIndex((h) => h.id === action.payload.id);
        if (index !== -1) {
          state.herds[index] = action.payload;
        }
        if (state.currentHerd?.id === action.payload.id) {
          state.currentHerd = action.payload;
        }
      })
      .addCase(updateHerd.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete herd
      .addCase(deleteHerd.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteHerd.fulfilled, (state, action) => {
        state.isLoading = false;
        state.herds = state.herds.filter((h) => h.id !== action.payload);
      })
      .addCase(deleteHerd.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearHerdError, setCurrentHerd } = herdSlice.actions;
export default herdSlice.reducer;

