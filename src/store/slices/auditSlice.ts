import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AuditService } from '@/services/auditService';
import { AuditLogEntry, AuditLogList, AuditLogQueryParams } from '@/types/audit';

interface AuditState {
  logs: AuditLogEntry[];
  currentLog: AuditLogEntry | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuditState = {
  logs: [],
  currentLog: null,
  isLoading: false,
  error: null,
};

export const fetchFarmAuditLogs = createAsyncThunk<
  AuditLogList,
  { farmId: string; params: AuditLogQueryParams },
  { rejectValue: string }
>(
  'audit/fetchFarmAuditLogs',
  async ({ farmId, params }, { rejectWithValue }) => {
    try {
      return await AuditService.getFarmAuditLogs(farmId, params);
    } catch (error: any) {
      return rejectWithValue(error?.message || error?.error || 'Failed to load activity logs');
    }
  }
);

export const fetchFarmAuditLogById = createAsyncThunk<
  AuditLogEntry,
  { farmId: string; logId: string },
  { rejectValue: string }
>(
  'audit/fetchFarmAuditLogById',
  async ({ farmId, logId }, { rejectWithValue }) => {
    try {
      return await AuditService.getFarmAuditLogById(farmId, logId);
    } catch (error: any) {
      return rejectWithValue(error?.message || error?.error || 'Failed to load audit log');
    }
  }
);

const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    clearAuditError: (state) => {
      state.error = null;
    },
    clearCurrentAuditLog: (state) => {
      state.currentLog = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFarmAuditLogs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFarmAuditLogs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.logs = action.payload.items;
      })
      .addCase(fetchFarmAuditLogs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.logs = [];
      })
      .addCase(fetchFarmAuditLogById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.currentLog = null;
      })
      .addCase(fetchFarmAuditLogById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentLog = action.payload;
      })
      .addCase(fetchFarmAuditLogById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.currentLog = null;
      });
  },
});

export const { clearAuditError, clearCurrentAuditLog } = auditSlice.actions;
export default auditSlice.reducer;

