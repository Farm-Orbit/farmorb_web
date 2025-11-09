import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Group, CreateGroupRequest, UpdateGroupRequest } from '@/types/group';
import { GroupService } from '@/services/groupService';
import { ListOptions, PaginatedList, SortOrder } from '@/types/list';

type GroupListPayload = PaginatedList<Group> & {
  sortBy?: string;
  sortOrder?: SortOrder;
  filters?: Record<string, string | string[]>;
};

interface GroupState {
  groups: Group[];
  currentGroup: Group | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: GroupState = {
  groups: [],
  currentGroup: null,
  isLoading: false,
  error: null,
};

const withListMetadata = (
  result: PaginatedList<Group>,
  params: ListOptions | undefined
): GroupListPayload => ({
  ...result,
  sortBy: params?.sortBy,
  sortOrder: params?.sortOrder,
  filters: params?.filters,
});

export const fetchFarmGroups = createAsyncThunk<
  GroupListPayload,
  { farmId: string; params?: ListOptions },
  { rejectValue: string }
>(
  'groups/fetchFarmGroups',
  async ({ farmId, params }, { rejectWithValue }) => {
    try {
      const result = await GroupService.getFarmGroups(farmId, params);
      return withListMetadata(result, params);
    } catch (error: any) {
      return rejectWithValue(error?.error || 'Failed to load groups');
    }
  }
);

export const fetchGroupById = createAsyncThunk<
  Group,
  { farmId: string; groupId: string },
  { rejectValue: string }
>(
  'groups/fetchGroupById',
  async ({ farmId, groupId }, { rejectWithValue }) => {
    try {
      return await GroupService.getGroup(farmId, groupId);
    } catch (error: any) {
      return rejectWithValue(error?.error || 'Failed to load group');
    }
  }
);

export const createGroup = createAsyncThunk<
  Group,
  { farmId: string; data: CreateGroupRequest },
  { rejectValue: string }
>(
  'groups/createGroup',
  async ({ farmId, data }, { rejectWithValue }) => {
    try {
      return await GroupService.createGroup(farmId, data);
    } catch (error: any) {
      return rejectWithValue(error?.error || 'Failed to create group');
    }
  }
);

export const updateGroup = createAsyncThunk<
  Group,
  { farmId: string; groupId: string; data: UpdateGroupRequest },
  { rejectValue: string }
>(
  'groups/updateGroup',
  async ({ farmId, groupId, data }, { rejectWithValue }) => {
    try {
      return await GroupService.updateGroup(farmId, groupId, data);
    } catch (error: any) {
      return rejectWithValue(error?.error || 'Failed to update group');
    }
  }
);

export const deleteGroup = createAsyncThunk<
  string,
  { farmId: string; groupId: string },
  { rejectValue: string }
>(
  'groups/deleteGroup',
  async ({ farmId, groupId }, { rejectWithValue }) => {
    try {
      await GroupService.deleteGroup(farmId, groupId);
      return groupId;
    } catch (error: any) {
      return rejectWithValue(error?.error || 'Failed to delete group');
    }
  }
);

const groupSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    clearGroupError: (state) => {
      state.error = null;
    },
    setCurrentGroup: (state, action: PayloadAction<Group | null>) => {
      state.currentGroup = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFarmGroups.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFarmGroups.fulfilled, (state, action) => {
        state.isLoading = false;
        state.groups = action.payload.items;
      })
      .addCase(fetchFarmGroups.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.groups = [];
      })
      .addCase(fetchGroupById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGroupById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentGroup = action.payload;
      })
      .addCase(fetchGroupById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createGroup.pending, (state) => {
        state.error = null;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.groups.push(action.payload);
        state.currentGroup = action.payload;
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(updateGroup.pending, (state) => {
        state.error = null;
      })
      .addCase(updateGroup.fulfilled, (state, action) => {
        const index = state.groups.findIndex((group) => group.id === action.payload.id);
        if (index !== -1) {
          state.groups[index] = action.payload;
        }
        state.currentGroup = action.payload;
      })
      .addCase(updateGroup.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(deleteGroup.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.groups = state.groups.filter((group) => group.id !== action.payload);
        if (state.currentGroup?.id === action.payload) {
          state.currentGroup = null;
        }
      })
      .addCase(deleteGroup.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearGroupError, setCurrentGroup } = groupSlice.actions;
export default groupSlice.reducer;
