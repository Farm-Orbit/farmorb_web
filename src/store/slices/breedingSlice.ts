import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BreedingService } from '@/services/breedingService';
import {
  BreedingRecord,
  BreedingRecordList,
  BreedingTimelinePayload,
  CreateBreedingRecordRequest,
  UpdateBreedingRecordRequest,
} from '@/types/breeding';
import { ListOptions, SortOrder } from '@/types/list';

interface BreedingListPayload extends BreedingRecordList {
  sortBy?: string;
  sortOrder?: SortOrder;
  filters?: Record<string, string | string[]>;
}

interface BreedingState {
  records: BreedingRecord[];
  currentRecord: BreedingRecord | null;
  timeline: BreedingRecord[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  isTimelineLoading: boolean;
  error: string | null;
}

const initialState: BreedingState = {
  records: [],
  currentRecord: null,
  timeline: [],
  total: 0,
  page: 1,
  pageSize: 10,
  isLoading: false,
  isTimelineLoading: false,
  error: null,
};

export const fetchBreedingRecords = createAsyncThunk<
  BreedingListPayload,
  { farmId: string; params?: ListOptions },
  { rejectValue: string }
>('breeding/fetchRecords', async ({ farmId, params }, { rejectWithValue }) => {
  try {
    const result = await BreedingService.getBreedingRecords(farmId, params);
    return {
      ...result,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      filters: params?.filters,
    };
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to load breeding records');
  }
});

export const fetchBreedingRecordById = createAsyncThunk<
  BreedingRecord,
  { farmId: string; recordId: string },
  { rejectValue: string }
>('breeding/fetchRecordById', async ({ farmId, recordId }, { rejectWithValue }) => {
  try {
    return await BreedingService.getBreedingRecordById(farmId, recordId);
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to load breeding record');
  }
});

export const createBreedingRecord = createAsyncThunk<
  BreedingRecord,
  { farmId: string; data: CreateBreedingRecordRequest },
  { rejectValue: string }
>('breeding/createRecord', async ({ farmId, data }, { rejectWithValue }) => {
  try {
    return await BreedingService.createBreedingRecord(farmId, data);
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to create breeding record');
  }
});

export const updateBreedingRecord = createAsyncThunk<
  BreedingRecord,
  { farmId: string; recordId: string; data: UpdateBreedingRecordRequest },
  { rejectValue: string }
>('breeding/updateRecord', async ({ farmId, recordId, data }, { rejectWithValue }) => {
  try {
    return await BreedingService.updateBreedingRecord(farmId, recordId, data);
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to update breeding record');
  }
});

export const deleteBreedingRecord = createAsyncThunk<
  string,
  { farmId: string; recordId: string },
  { rejectValue: string }
>('breeding/deleteRecord', async ({ farmId, recordId }, { rejectWithValue }) => {
  try {
    await BreedingService.deleteBreedingRecord(farmId, recordId);
    return recordId;
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to delete breeding record');
  }
});

export const fetchBreedingTimeline = createAsyncThunk<
  BreedingTimelinePayload,
  { farmId: string; animalId: string; limit?: number },
  { rejectValue: string }
>('breeding/fetchTimeline', async ({ farmId, animalId, limit }, { rejectWithValue }) => {
  try {
    return await BreedingService.getBreedingTimeline(farmId, animalId, limit);
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to load breeding timeline');
  }
});

const breedingSlice = createSlice({
  name: 'breeding',
  initialState,
  reducers: {
    clearBreedingError: (state) => {
      state.error = null;
    },
    clearBreedingState: () => ({ ...initialState }),
    setCurrentBreedingRecord: (state, action: PayloadAction<BreedingRecord | null>) => {
      state.currentRecord = action.payload;
    },
    clearTimeline: (state) => {
      state.timeline = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBreedingRecords.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBreedingRecords.fulfilled, (state, action) => {
        state.isLoading = false;
        state.records = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pageSize = action.payload.pageSize;
      })
      .addCase(fetchBreedingRecords.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to load breeding records';
        state.records = [];
        state.total = 0;
      })
      .addCase(fetchBreedingRecordById.fulfilled, (state, action) => {
        state.currentRecord = action.payload;
      })
      .addCase(fetchBreedingRecordById.rejected, (state, action) => {
        state.error = action.payload || 'Failed to load breeding record';
      })
      .addCase(createBreedingRecord.fulfilled, (state, action) => {
        state.records = [action.payload, ...state.records];
        state.total += 1;
        state.currentRecord = action.payload;
      })
      .addCase(createBreedingRecord.rejected, (state, action) => {
        state.error = action.payload || 'Failed to create breeding record';
      })
      .addCase(updateBreedingRecord.fulfilled, (state, action) => {
        state.records = state.records.map((record) => (record.id === action.payload.id ? action.payload : record));
        if (state.currentRecord?.id === action.payload.id) {
          state.currentRecord = action.payload;
        }
      })
      .addCase(updateBreedingRecord.rejected, (state, action) => {
        state.error = action.payload || 'Failed to update breeding record';
      })
      .addCase(deleteBreedingRecord.fulfilled, (state, action) => {
        state.records = state.records.filter((record) => record.id !== action.payload);
        state.total = Math.max(state.total - 1, 0);
        if (state.currentRecord?.id === action.payload) {
          state.currentRecord = null;
        }
      })
      .addCase(deleteBreedingRecord.rejected, (state, action) => {
        state.error = action.payload || 'Failed to delete breeding record';
      })
      .addCase(fetchBreedingTimeline.pending, (state) => {
        state.isTimelineLoading = true;
      })
      .addCase(fetchBreedingTimeline.fulfilled, (state, action) => {
        state.isTimelineLoading = false;
        state.timeline = action.payload.items;
      })
      .addCase(fetchBreedingTimeline.rejected, (state, action) => {
        state.isTimelineLoading = false;
        state.error = action.payload || 'Failed to load breeding timeline';
      });
  },
});

export const {
  clearBreedingError,
  clearBreedingState,
  setCurrentBreedingRecord,
  clearTimeline,
} = breedingSlice.actions;

export default breedingSlice.reducer;
