import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FeedingService } from '@/services/feedingService';
import {
  FeedingRecord,
  FeedingRecordList,
  CreateFeedingRecordRequest,
  UpdateFeedingRecordRequest,
} from '@/types/feeding';
import { ListOptions, SortOrder } from '@/types/list';

interface FeedingRecordsPayload extends FeedingRecordList {
  sortBy?: string;
  sortOrder?: SortOrder;
  filters?: Record<string, string | string[]>;
}

interface FeedingState {
  records: FeedingRecord[];
  currentRecord: FeedingRecord | null;
  recordsTotal: number;
  recordsPage: number;
  recordsPageSize: number;
  isLoadingRecords: boolean;
  error: string | null;
}

const initialState: FeedingState = {
  records: [],
  currentRecord: null,
  recordsTotal: 0,
  recordsPage: 1,
  recordsPageSize: 10,
  isLoadingRecords: false,
  error: null,
};

export const fetchFeedingRecords = createAsyncThunk<
  FeedingRecordsPayload,
  { farmId: string; params?: ListOptions },
  { rejectValue: string }
>('feeding/fetchRecords', async ({ farmId, params }, { rejectWithValue }) => {
  try {
    const result = await FeedingService.getFeedingRecords(farmId, params);
    return {
      ...result,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      filters: params?.filters,
    };
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to load feeding records');
  }
});

export const fetchFeedingRecordById = createAsyncThunk<
  FeedingRecord,
  { farmId: string; recordId: string },
  { rejectValue: string }
>('feeding/fetchRecordById', async ({ farmId, recordId }, { rejectWithValue }) => {
  try {
    return await FeedingService.getFeedingRecordById(farmId, recordId);
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to load feeding record');
  }
});

export const createFeedingRecord = createAsyncThunk<
  FeedingRecord,
  { farmId: string; data: CreateFeedingRecordRequest },
  { rejectValue: string }
>('feeding/createRecord', async ({ farmId, data }, { rejectWithValue }) => {
  try {
    return await FeedingService.createFeedingRecord(farmId, data);
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to create feeding record');
  }
});

export const updateFeedingRecord = createAsyncThunk<
  FeedingRecord,
  { farmId: string; recordId: string; data: UpdateFeedingRecordRequest },
  { rejectValue: string }
>('feeding/updateRecord', async ({ farmId, recordId, data }, { rejectWithValue }) => {
  try {
    return await FeedingService.updateFeedingRecord(farmId, recordId, data);
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to update feeding record');
  }
});

export const deleteFeedingRecord = createAsyncThunk<
  string,
  { farmId: string; recordId: string },
  { rejectValue: string }
>('feeding/deleteRecord', async ({ farmId, recordId }, { rejectWithValue }) => {
  try {
    await FeedingService.deleteFeedingRecord(farmId, recordId);
    return recordId;
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to delete feeding record');
  }
});

const feedingSlice = createSlice({
  name: 'feeding',
  initialState,
  reducers: {
    clearFeedingError: (state) => {
      state.error = null;
    },
    setCurrentFeedingRecord: (state, action: PayloadAction<FeedingRecord | null>) => {
      state.currentRecord = action.payload;
    },
    clearFeedingState: () => ({ ...initialState }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeedingRecords.pending, (state) => {
        state.isLoadingRecords = true;
        state.error = null;
      })
      .addCase(fetchFeedingRecords.fulfilled, (state, action) => {
        state.isLoadingRecords = false;
        state.records = action.payload.items;
        state.recordsTotal = action.payload.total;
        state.recordsPage = action.payload.page;
        state.recordsPageSize = action.payload.pageSize;
      })
      .addCase(fetchFeedingRecords.rejected, (state, action) => {
        state.isLoadingRecords = false;
        state.error = action.payload || 'Failed to load feeding records';
        state.records = [];
        state.recordsTotal = 0;
      })
      .addCase(fetchFeedingRecordById.fulfilled, (state, action) => {
        state.currentRecord = action.payload;
      })
      .addCase(fetchFeedingRecordById.rejected, (state, action) => {
        state.error = action.payload || 'Failed to load feeding record';
      })
      .addCase(createFeedingRecord.fulfilled, (state, action) => {
        state.records = [action.payload, ...state.records];
        state.recordsTotal += 1;
        state.currentRecord = action.payload;
      })
      .addCase(createFeedingRecord.rejected, (state, action) => {
        state.error = action.payload || 'Failed to create feeding record';
      })
      .addCase(updateFeedingRecord.fulfilled, (state, action) => {
        state.records = state.records.map((record) => (record.id === action.payload.id ? action.payload : record));
        if (state.currentRecord?.id === action.payload.id) {
          state.currentRecord = action.payload;
        }
      })
      .addCase(updateFeedingRecord.rejected, (state, action) => {
        state.error = action.payload || 'Failed to update feeding record';
      })
      .addCase(deleteFeedingRecord.fulfilled, (state, action) => {
        state.records = state.records.filter((record) => record.id !== action.payload);
        state.recordsTotal = Math.max(state.recordsTotal - 1, 0);
        if (state.currentRecord?.id === action.payload) {
          state.currentRecord = null;
        }
      })
      .addCase(deleteFeedingRecord.rejected, (state, action) => {
        state.error = action.payload || 'Failed to delete feeding record';
      });
  },
});

export const { clearFeedingError, setCurrentFeedingRecord, clearFeedingState } = feedingSlice.actions;

export default feedingSlice.reducer;

