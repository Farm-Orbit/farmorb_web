import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import farmReducer from './slices/farmSlice';
import animalReducer from './slices/animalSlice';
import farmMemberReducer from './slices/farmMemberSlice';
import groupReducer from './slices/groupSlice';
import auditReducer from './slices/auditSlice';
import breedingReducer from './slices/breedingSlice';
import healthReducer from './slices/healthSlice';

// Configure the Redux store
export const store = configureStore({
    reducer: {
        auth: authReducer,
        farms: farmReducer,
        animals: animalReducer,
        farmMembers: farmMemberReducer,
        groups: groupReducer,
        audit: auditReducer,
        breeding: breedingReducer,
        health: healthReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
                // Ignore these field paths in all actions
                ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
                // Ignore these paths in the state
                ignoredPaths: ['items.dates'],
            },
        }),
    devTools: process.env.NODE_ENV !== 'production',
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export typed hooks for use throughout the app
export { useAppDispatch, useAppSelector } from '@/store/hooks';
