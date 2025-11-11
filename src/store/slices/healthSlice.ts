import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HealthService } from '@/services/healthService';
import {
  HealthRecord,
  HealthRecordList,
  CreateHealthRecordRequest,
  UpdateHealthRecordRequest,
  HealthSchedule,
  HealthScheduleList,
  CreateHealthScheduleRequest,
  UpdateHealthScheduleRequest,
} from '@/types/health';
import { ListOptions, SortOrder } from '@/types/list';

interface HealthRecordsPayload extends HealthRecordList {
  sortBy?: string;
  sortOrder?: SortOrder;
  filters?: Record<string, string | string[]>;
}

interface HealthSchedulesPayload extends HealthScheduleList {
  sortBy?: string;
  sortOrder?: SortOrder;
  filters?: Record<string, string | string[]>;
}

interface HealthState {
  records: HealthRecord[];
  schedules: HealthSchedule[];
  currentRecord: HealthRecord | null;
  currentSchedule: HealthSchedule | null;
  recordsTotal: number;
  recordsPage: number;
  recordsPageSize: number;
  schedulesTotal: number;
  schedulesPage: number;
  schedulesPageSize: number;
  isLoadingRecords: boolean;
  isLoadingSchedules: boolean;
  error: string | null;
}

const initialState: HealthState = {
  records: [],
  schedules: [],
  currentRecord: null,
  currentSchedule: null,
  recordsTotal: 0,
  recordsPage: 1,
  recordsPageSize: 10,
  schedulesTotal: 0,
  schedulesPage: 1,
  schedulesPageSize: 10,
  isLoadingRecords: false,
  isLoadingSchedules: false,
  error: null,
};

export const fetchHealthRecords = createAsyncThunk<
  HealthRecordsPayload,
  { farmId: string; params?: ListOptions },
  { rejectValue: string }
>('health/fetchRecords', async ({ farmId, params }, { rejectWithValue }) => {
  try {
    const result = await HealthService.getHealthRecords(farmId, params);
    return {
      ...result,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      filters: params?.filters,
    };
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to load health records');
  }
});

export const fetchHealthRecordById = createAsyncThunk<
  HealthRecord,
  { farmId: string; recordId: string },
  { rejectValue: string }
>('health/fetchRecordById', async ({ farmId, recordId }, { rejectWithValue }) => {
  try {
    return await HealthService.getHealthRecordById(farmId, recordId);
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to load health record');
  }
});

export const createHealthRecord = createAsyncThunk<
  HealthRecord,
  { farmId: string; data: CreateHealthRecordRequest },
  { rejectValue: string }
>('health/createRecord', async ({ farmId, data }, { rejectWithValue }) => {
  try {
    return await HealthService.createHealthRecord(farmId, data);
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to create health record');
  }
});

export const updateHealthRecord = createAsyncThunk<
  HealthRecord,
  { farmId: string; recordId: string; data: UpdateHealthRecordRequest },
  { rejectValue: string }
>('health/updateRecord', async ({ farmId, recordId, data }, { rejectWithValue }) => {
  try {
    return await HealthService.updateHealthRecord(farmId, recordId, data);
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to update health record');
  }
});

export const deleteHealthRecord = createAsyncThunk<
  string,
  { farmId: string; recordId: string },
  { rejectValue: string }
>('health/deleteRecord', async ({ farmId, recordId }, { rejectWithValue }) => {
  try {
    await HealthService.deleteHealthRecord(farmId, recordId);
    return recordId;
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to delete health record');
  }
});

export const fetchHealthSchedules = createAsyncThunk<
  HealthSchedulesPayload,
  { farmId: string; params?: ListOptions },
  { rejectValue: string }
>('health/fetchSchedules', async ({ farmId, params }, { rejectWithValue }) => {
  try {
    const result = await HealthService.getHealthSchedules(farmId, params);
    return {
      ...result,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      filters: params?.filters,
    };
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to load health schedules');
  }
});

export const fetchHealthScheduleById = createAsyncThunk<
  HealthSchedule,
  { farmId: string; scheduleId: string },
  { rejectValue: string }
>('health/fetchScheduleById', async ({ farmId, scheduleId }, { rejectWithValue }) => {
  try {
    return await HealthService.getHealthScheduleById(farmId, scheduleId);
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to load health schedule');
  }
});

export const createHealthSchedule = createAsyncThunk<
  HealthSchedule,
  { farmId: string; data: CreateHealthScheduleRequest },
  { rejectValue: string }
>('health/createSchedule', async ({ farmId, data }, { rejectWithValue }) => {
  try {
    return await HealthService.createHealthSchedule(farmId, data);
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to create health schedule');
  }
});

export const updateHealthSchedule = createAsyncThunk<
  HealthSchedule,
  { farmId: string; scheduleId: string; data: UpdateHealthScheduleRequest },
  { rejectValue: string }
>('health/updateSchedule', async ({ farmId, scheduleId, data }, { rejectWithValue }) => {
  try {
    return await HealthService.updateHealthSchedule(farmId, scheduleId, data);
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to update health schedule');
  }
});

export const deleteHealthSchedule = createAsyncThunk<
  string,
  { farmId: string; scheduleId: string },
  { rejectValue: string }
>('health/deleteSchedule', async ({ farmId, scheduleId }, { rejectWithValue }) => {
  try {
    await HealthService.deleteHealthSchedule(farmId, scheduleId);
    return scheduleId;
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to delete health schedule');
  }
});

export const setHealthScheduleStatus = createAsyncThunk<
  HealthSchedule,
  { farmId: string; scheduleId: string; active: boolean },
  { rejectValue: string }
>('health/setScheduleStatus', async ({ farmId, scheduleId, active }, { rejectWithValue }) => {
  try {
    return await HealthService.setHealthScheduleStatus(farmId, scheduleId, active);
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to update schedule status');
  }
});

export const recordHealthScheduleCompletion = createAsyncThunk<
  HealthRecord,
  { farmId: string; scheduleId: string; data: CreateHealthRecordRequest },
  { rejectValue: string }
>('health/recordCompletion', async ({ farmId, scheduleId, data }, { rejectWithValue }) => {
  try {
    return await HealthService.recordScheduleCompletion(farmId, scheduleId, data);
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to record schedule completion');
  }
});

const healthSlice = createSlice({
  name: 'health',
  initialState,
  reducers: {
    clearHealthError: (state) => {
      state.error = null;
    },
    setCurrentHealthRecord: (state, action: PayloadAction<HealthRecord | null>) => {
      state.currentRecord = action.payload;
    },
    setCurrentHealthSchedule: (state, action: PayloadAction<HealthSchedule | null>) => {
      state.currentSchedule = action.payload;
    },
    clearHealthState: () => ({ ...initialState }),
  },
  extraReducers: (builder) => {
    builder
      // Records
      .addCase(fetchHealthRecords.pending, (state) => {
        state.isLoadingRecords = true;
        state.error = null;
      })
      .addCase(fetchHealthRecords.fulfilled, (state, action) => {
        state.isLoadingRecords = false;
        state.records = action.payload.items;
        state.recordsTotal = action.payload.total;
        state.recordsPage = action.payload.page;
        state.recordsPageSize = action.payload.pageSize;
      })
      .addCase(fetchHealthRecords.rejected, (state, action) => {
        state.isLoadingRecords = false;
        state.error = action.payload || 'Failed to load health records';
        state.records = [];
        state.recordsTotal = 0;
      })
      .addCase(fetchHealthRecordById.fulfilled, (state, action) => {
        state.currentRecord = action.payload;
      })
      .addCase(fetchHealthRecordById.rejected, (state, action) => {
        state.error = action.payload || 'Failed to load health record';
      })
      .addCase(createHealthRecord.fulfilled, (state, action) => {
        state.records = [action.payload, ...state.records];
        state.recordsTotal += 1;
        state.currentRecord = action.payload;
      })
      .addCase(createHealthRecord.rejected, (state, action) => {
        state.error = action.payload || 'Failed to create health record';
      })
      .addCase(updateHealthRecord.fulfilled, (state, action) => {
        state.records = state.records.map((record) => (record.id === action.payload.id ? action.payload : record));
        if (state.currentRecord?.id === action.payload.id) {
          state.currentRecord = action.payload;
        }
      })
      .addCase(updateHealthRecord.rejected, (state, action) => {
        state.error = action.payload || 'Failed to update health record';
      })
      .addCase(deleteHealthRecord.fulfilled, (state, action) => {
        state.records = state.records.filter((record) => record.id !== action.payload);
        state.recordsTotal = Math.max(state.recordsTotal - 1, 0);
        if (state.currentRecord?.id === action.payload) {
          state.currentRecord = null;
        }
      })
      .addCase(deleteHealthRecord.rejected, (state, action) => {
        state.error = action.payload || 'Failed to delete health record';
      })
      .addCase(recordHealthScheduleCompletion.fulfilled, (state, action) => {
        state.records = [action.payload, ...state.records];
        state.recordsTotal += 1;
      })
      .addCase(recordHealthScheduleCompletion.rejected, (state, action) => {
        state.error = action.payload || 'Failed to record health schedule completion';
      })
      // Schedules
      .addCase(fetchHealthSchedules.pending, (state) => {
        state.isLoadingSchedules = true;
      })
      .addCase(fetchHealthSchedules.fulfilled, (state, action) => {
        state.isLoadingSchedules = false;
        state.schedules = action.payload.items;
        state.schedulesTotal = action.payload.total;
        state.schedulesPage = action.payload.page;
        state.schedulesPageSize = action.payload.pageSize;
      })
      .addCase(fetchHealthSchedules.rejected, (state, action) => {
        state.isLoadingSchedules = false;
        state.error = action.payload || 'Failed to load health schedules';
        state.schedules = [];
        state.schedulesTotal = 0;
      })
      .addCase(fetchHealthScheduleById.fulfilled, (state, action) => {
        state.currentSchedule = action.payload;
      })
      .addCase(fetchHealthScheduleById.rejected, (state, action) => {
        state.error = action.payload || 'Failed to load health schedule';
      })
      .addCase(createHealthSchedule.fulfilled, (state, action) => {
        state.schedules = [action.payload, ...state.schedules];
        state.schedulesTotal += 1;
        state.currentSchedule = action.payload;
      })
      .addCase(createHealthSchedule.rejected, (state, action) => {
        state.error = action.payload || 'Failed to create health schedule';
      })
      .addCase(updateHealthSchedule.fulfilled, (state, action) => {
        state.schedules = state.schedules.map((schedule) =>
          schedule.id === action.payload.id ? action.payload : schedule
        );
        if (state.currentSchedule?.id === action.payload.id) {
          state.currentSchedule = action.payload;
        }
      })
      .addCase(updateHealthSchedule.rejected, (state, action) => {
        state.error = action.payload || 'Failed to update health schedule';
      })
      .addCase(deleteHealthSchedule.fulfilled, (state, action) => {
        state.schedules = state.schedules.filter((schedule) => schedule.id !== action.payload);
        state.schedulesTotal = Math.max(state.schedulesTotal - 1, 0);
        if (state.currentSchedule?.id === action.payload) {
          state.currentSchedule = null;
        }
      })
      .addCase(deleteHealthSchedule.rejected, (state, action) => {
        state.error = action.payload || 'Failed to delete health schedule';
      })
      .addCase(setHealthScheduleStatus.fulfilled, (state, action) => {
        state.schedules = state.schedules.map((schedule) =>
          schedule.id === action.payload.id ? action.payload : schedule
        );
        if (state.currentSchedule?.id === action.payload.id) {
          state.currentSchedule = action.payload;
        }
      })
      .addCase(setHealthScheduleStatus.rejected, (state, action) => {
        state.error = action.payload || 'Failed to update schedule status';
      });
  },
});

export const {
  clearHealthError,
  setCurrentHealthRecord,
  setCurrentHealthSchedule,
  clearHealthState,
} = healthSlice.actions;

export default healthSlice.reducer;
