import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AnimalService } from '@/services/animalService';
import { Animal, CreateAnimalData } from '@/types/animal';

interface AnimalState {
  animals: Animal[];
  currentAnimal: Animal | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AnimalState = {
  animals: [],
  currentAnimal: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchAnimalById = createAsyncThunk(
  'animals/fetchAnimalById',
  async ({ farmId, animalId }: { farmId: string; animalId: string }, { rejectWithValue }) => {
    try {
      const animal = await AnimalService.getAnimalById(farmId, animalId);
      return animal;
    } catch (error: any) {
      return rejectWithValue(error.error || 'Failed to fetch animal');
    }
  }
);

export const createAnimal = createAsyncThunk(
  'animals/createAnimal',
  async ({ farmId, data }: { farmId: string; data: CreateAnimalData }, { rejectWithValue }) => {
    try {
      const animal = await AnimalService.createAnimal(farmId, data);
      return animal;
    } catch (error: any) {
      return rejectWithValue(error.error || 'Failed to create animal');
    }
  }
);

export const updateAnimal = createAsyncThunk(
  'animals/updateAnimal',
  async ({ farmId, animalId, data }: { farmId: string; animalId: string; data: Partial<CreateAnimalData & { status?: string }> }, { rejectWithValue }) => {
    try {
      const animal = await AnimalService.updateAnimal(farmId, animalId, data);
      return animal;
    } catch (error: any) {
      return rejectWithValue(error.error || 'Failed to update animal');
    }
  }
);

export const deleteAnimal = createAsyncThunk(
  'animals/deleteAnimal',
  async ({ farmId, animalId }: { farmId: string; animalId: string }, { rejectWithValue }) => {
    try {
      await AnimalService.deleteAnimal(farmId, animalId);
      return animalId;
    } catch (error: any) {
      return rejectWithValue(error.error || 'Failed to delete animal');
    }
  }
);

const animalSlice = createSlice({
  name: 'animals',
  initialState,
  reducers: {
    clearAnimalError: (state) => {
      state.error = null;
    },
    setCurrentAnimal: (state, action: PayloadAction<Animal | null>) => {
      state.currentAnimal = action.payload;
    },
    clearAnimals: (state) => {
      state.animals = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch animal by ID
      .addCase(fetchAnimalById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAnimalById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentAnimal = action.payload;
      })
      .addCase(fetchAnimalById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create animal
      .addCase(createAnimal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAnimal.fulfilled, (state, action) => {
        state.isLoading = false;
        state.animals.push(action.payload);
      })
      .addCase(createAnimal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update animal
      .addCase(updateAnimal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateAnimal.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.animals.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.animals[index] = action.payload;
        }
        if (state.currentAnimal?.id === action.payload.id) {
          state.currentAnimal = action.payload;
        }
      })
      .addCase(updateAnimal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete animal
      .addCase(deleteAnimal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteAnimal.fulfilled, (state, action) => {
        state.isLoading = false;
        state.animals = state.animals.filter((a) => a.id !== action.payload);
      })
      .addCase(deleteAnimal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAnimalError, setCurrentAnimal, clearAnimals } = animalSlice.actions;
export default animalSlice.reducer;

