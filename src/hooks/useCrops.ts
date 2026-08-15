import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchCropTypes,
    createCropType,
    fetchVarieties,
    createVariety,
    fetchGrowLocations,
    createGrowLocation,
    fetchPlantings,
    createPlanting,
    fetchHarvests,
    createHarvest,
    clearCropError,
} from '@/store/slices/cropSlice';
import {
    CreateCropTypeData,
    CreateCropVarietyData,
    CreateGrowLocationData,
    CreatePlantingData,
    CreateHarvestData,
} from '@/types/crop';

export const useCrops = () => {
    const dispatch = useAppDispatch();
    const {
        cropTypes,
        varieties,
        locations,
        plantings,
        harvests,
        isLoading,
        error,
    } = useAppSelector((state) => state.crops);

    return {
        cropTypes,
        varieties,
        locations,
        plantings,
        harvests,
        isLoading,
        error,
        loadCropTypes: useCallback((farmId: string) => dispatch(fetchCropTypes(farmId)), [dispatch]),
        addCropType: useCallback(
            (farmId: string, data: CreateCropTypeData) => dispatch(createCropType({ farmId, data })),
            [dispatch]
        ),
        loadVarieties: useCallback((cropTypeId: string) => dispatch(fetchVarieties(cropTypeId)), [dispatch]),
        addVariety: useCallback(
            (cropTypeId: string, data: CreateCropVarietyData) =>
                dispatch(createVariety({ cropTypeId, data })),
            [dispatch]
        ),
        loadLocations: useCallback((farmId: string) => dispatch(fetchGrowLocations(farmId)), [dispatch]),
        addLocation: useCallback(
            (farmId: string, data: CreateGrowLocationData) =>
                dispatch(createGrowLocation({ farmId, data })),
            [dispatch]
        ),
        loadPlantings: useCallback((farmId: string) => dispatch(fetchPlantings(farmId)), [dispatch]),
        addPlanting: useCallback(
            (farmId: string, data: CreatePlantingData) => dispatch(createPlanting({ farmId, data })),
            [dispatch]
        ),
        loadHarvests: useCallback((farmId: string) => dispatch(fetchHarvests(farmId)), [dispatch]),
        addHarvest: useCallback(
            (farmId: string, data: CreateHarvestData) => dispatch(createHarvest({ farmId, data })),
            [dispatch]
        ),
        clearError: useCallback(() => dispatch(clearCropError()), [dispatch]),
    };
};

export default useCrops;
