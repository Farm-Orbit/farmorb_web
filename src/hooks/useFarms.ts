import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchFarms,
    fetchFarmById,
    createFarm,
    updateFarm,
    deleteFarm,
    clearFarmError,
    setCurrentFarm,
} from '@/store/slices/farmSlice';
import { CreateFarmData, UpdateFarmData, Farm } from '@/types/farm';
import { useCallback } from 'react';

export const useFarms = () => {
    const dispatch = useAppDispatch();
    const { farms, currentFarm, isLoading, error } = useAppSelector((state) => state.farms);

    const getFarms = useCallback(() => {
        dispatch(fetchFarms());
    }, [dispatch]);

    const getFarmById = useCallback(
        (id: string) => {
            dispatch(fetchFarmById(id));
        },
        [dispatch]
    );

    const addFarm = useCallback(
        (farmData: CreateFarmData) => {
            return dispatch(createFarm(farmData)).unwrap();
        },
        [dispatch]
    );

    const editFarm = useCallback(
        (id: string, data: UpdateFarmData) => {
            return dispatch(updateFarm({ id, data })).unwrap();
        },
        [dispatch]
    );

    const removeFarm = useCallback(
        (id: string) => {
            return dispatch(deleteFarm(id)).unwrap();
        },
        [dispatch]
    );

    const clearError = useCallback(() => {
        dispatch(clearFarmError());
    }, [dispatch]);

    const selectFarm = useCallback(
        (farm: Farm | null) => {
            dispatch(setCurrentFarm(farm));
        },
        [dispatch]
    );

    return {
        farms,
        currentFarm,
        isLoading,
        error,
        getFarms,
        getFarmById,
        addFarm,
        editFarm,
        removeFarm,
        clearError,
        clearFarmError: clearError,
        selectFarm,
    };
};