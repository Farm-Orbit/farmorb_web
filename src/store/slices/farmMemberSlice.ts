import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { FarmMemberService } from '@/services/farmMemberService';
import { FarmMemberResponse, InviteMemberRequest, FarmInvitationResponse } from '@/types/farmMember';

interface FarmMemberState {
  members: FarmMemberResponse[];
  invitations: FarmInvitationResponse[];
  isLoading: boolean;
  error: string | null;
}

const initialState: FarmMemberState = {
  members: [],
  invitations: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchFarmMembers = createAsyncThunk(
  'farmMembers/fetchFarmMembers',
  async (farmId: string, { rejectWithValue }) => {
    try {
      const members = await FarmMemberService.getFarmMembers(farmId);
      return members;
    } catch (error: any) {
      return rejectWithValue(error.error || 'Failed to fetch farm members');
    }
  }
);

export const inviteFarmMember = createAsyncThunk(
  'farmMembers/inviteFarmMember',
  async ({ farmId, data }: { farmId: string; data: InviteMemberRequest }, { rejectWithValue }) => {
    try {
      const invitation = await FarmMemberService.inviteMember(farmId, data);
      return invitation;
    } catch (error: any) {
      return rejectWithValue(error.error || 'Failed to invite member');
    }
  }
);

export const updateFarmMemberRole = createAsyncThunk(
  'farmMembers/updateFarmMemberRole',
  async ({ farmId, userId, role }: { farmId: string; userId: string; role: string }, { rejectWithValue }) => {
    try {
      const member = await FarmMemberService.updateFarmMember(farmId, userId, { role });
      return member;
    } catch (error: any) {
      return rejectWithValue(error.error || 'Failed to update member role');
    }
  }
);

export const removeFarmMember = createAsyncThunk(
  'farmMembers/removeFarmMember',
  async ({ farmId, userId }: { farmId: string; userId: string }, { rejectWithValue }) => {
    try {
      await FarmMemberService.removeFarmMember(farmId, userId);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.error || 'Failed to remove member');
    }
  }
);

export const fetchMyInvitations = createAsyncThunk(
  'farmMembers/fetchMyInvitations',
  async ({ email, phone }: { email?: string; phone?: string } = {}, { rejectWithValue }) => {
    try {
      const invitations = await FarmMemberService.getUserInvitations(email, phone);
      return invitations;
    } catch (error: any) {
      return rejectWithValue(error.error || 'Failed to fetch invitations');
    }
  }
);

export const respondToInvitation = createAsyncThunk(
  'farmMembers/respondToInvitation',
  async ({ invitationId, accept }: { invitationId: string; accept: boolean }, { rejectWithValue }) => {
    try {
      if (accept) {
        await FarmMemberService.acceptInvitation(invitationId);
      } else {
        await FarmMemberService.declineInvitation(invitationId);
      }
      return invitationId;
    } catch (error: any) {
      return rejectWithValue(error.error || 'Failed to respond to invitation');
    }
  }
);

const farmMemberSlice = createSlice({
  name: 'farmMembers',
  initialState,
  reducers: {
    clearMemberError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch farm members
    builder.addCase(fetchFarmMembers.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchFarmMembers.fulfilled, (state, action: PayloadAction<FarmMemberResponse[]>) => {
      state.isLoading = false;
      state.members = action.payload;
    });
    builder.addCase(fetchFarmMembers.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Invite farm member
    builder.addCase(inviteFarmMember.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(inviteFarmMember.fulfilled, (state) => {
      state.isLoading = false;
    });
    builder.addCase(inviteFarmMember.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Update member role
    builder.addCase(updateFarmMemberRole.pending, (state) => {
      state.error = null;
    });
    builder.addCase(updateFarmMemberRole.fulfilled, (state, action: PayloadAction<FarmMemberResponse>) => {
      const index = state.members.findIndex(m => m.user_id === action.payload.user_id);
      if (index !== -1) {
        state.members[index] = action.payload;
      }
    });
    builder.addCase(updateFarmMemberRole.rejected, (state, action) => {
      state.error = action.payload as string;
    });

    // Remove member
    builder.addCase(removeFarmMember.pending, (state) => {
      state.error = null;
    });
    builder.addCase(removeFarmMember.fulfilled, (state, action: PayloadAction<string>) => {
      state.members = state.members.filter(m => m.user_id !== action.payload);
    });
    builder.addCase(removeFarmMember.rejected, (state, action) => {
      state.error = action.payload as string;
    });

    // Fetch my invitations
    builder.addCase(fetchMyInvitations.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchMyInvitations.fulfilled, (state, action: PayloadAction<FarmInvitationResponse[]>) => {
      state.isLoading = false;
      state.invitations = action.payload;
    });
    builder.addCase(fetchMyInvitations.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Respond to invitation
    builder.addCase(respondToInvitation.pending, (state) => {
      state.error = null;
    });
    builder.addCase(respondToInvitation.fulfilled, (state, action: PayloadAction<string>) => {
      state.invitations = state.invitations.filter(i => i.id !== action.payload);
    });
    builder.addCase(respondToInvitation.rejected, (state, action) => {
      state.error = action.payload as string;
    });
  },
});

export const { clearMemberError } = farmMemberSlice.actions;
export default farmMemberSlice.reducer;

