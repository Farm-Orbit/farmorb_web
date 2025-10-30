import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchFarmHerds,
    fetchHerdById,
    createHerd,
    updateHerd,
    deleteHerd,
    clearHerdError,
    setCurrentHerd,
} from '@/store/slices/herdSlice';
import { Herd, CreateHerdData } from '@/types/herd';
import { useCallback } from 'react';

export const useHerds = () => {
    const dispatch = useAppDispatch();
    const { herds, currentHerd, isLoading, error } = useAppSelector((state) => state.herds);

    const getFarmHerds = useCallback(
        (farmId: string) => {
            dispatch(fetchFarmHerds(farmId));
        },
        [dispatch]
    );

    const getHerdById = useCallback(
        (farmId: string, herdId: string) => {
            dispatch(fetchHerdById({ farmId, herdId }));
        },
        [dispatch]
    );

    const addHerd = useCallback(
        (farmId: string, herdData: CreateHerdData) => {
            return dispatch(createHerd({ farmId, data: herdData })).unwrap();
        },
        [dispatch]
    );

    const editHerd = useCallback(
        (farmId: string, herdId: string, data: Partial<CreateHerdData>) => {
            return dispatch(updateHerd({ farmId, herdId, data })).unwrap();
        },
        [dispatch]
    );

    const removeHerd = useCallback(
        (farmId: string, herdId: string) => {
            return dispatch(deleteHerd({ farmId, herdId })).unwrap();
        },
        [dispatch]
    );

    const clearError = useCallback(() => {
        dispatch(clearHerdError());
    }, [dispatch]);

    const selectHerd = useCallback(
        (herd: Herd | null) => {
            dispatch(setCurrentHerd(herd));
        },
        [dispatch]
    );

    return {
        herds,
        currentHerd,
        isLoading,
        error,
        getFarmHerds,
        getHerdById,
        addHerd,
        editHerd,
        removeHerd,
        clearError,
        clearHerdError: clearError,
        selectHerd,
    };
};

