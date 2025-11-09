import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchFarmAnimals,
    fetchAnimalById,
    createAnimal,
    updateAnimal,
    deleteAnimal,
    clearAnimalError,
    setCurrentAnimal,
    clearAnimals,
} from '@/store/slices/animalSlice';
import { Animal, CreateAnimalData } from '@/types/animal';
import { ListOptions } from '@/types/list';
import { useCallback } from 'react';

export const useAnimals = () => {
    const dispatch = useAppDispatch();
    const { animals, currentAnimal, isLoading, error } = useAppSelector((state) => state.animals);

    const getFarmAnimals = useCallback(
        (farmId: string, params?: ListOptions) => {
            return dispatch(fetchFarmAnimals({ farmId, params })).unwrap();
        },
        [dispatch]
    );

    const getAnimalById = useCallback(
        (farmId: string, animalId: string) => {
            return dispatch(fetchAnimalById({ farmId, animalId })).unwrap();
        },
        [dispatch]
    );

    const addAnimal = useCallback(
        (farmId: string, animalData: CreateAnimalData) => {
            return dispatch(createAnimal({ farmId, data: animalData })).unwrap();
        },
        [dispatch]
    );

    const editAnimal = useCallback(
        (farmId: string, animalId: string, data: Partial<CreateAnimalData & { status?: string; group_id?: string }>) => {
            return dispatch(updateAnimal({ farmId, animalId, data })).unwrap();
        },
        [dispatch]
    );

    const removeAnimal = useCallback(
        (farmId: string, animalId: string) => {
            return dispatch(deleteAnimal({ farmId, animalId })).unwrap();
        },
        [dispatch]
    );

    const clearError = useCallback(() => {
        dispatch(clearAnimalError());
    }, [dispatch]);

    const selectAnimal = useCallback(
        (animal: Animal | null) => {
            dispatch(setCurrentAnimal(animal));
        },
        [dispatch]
    );

    const clearAnimalsList = useCallback(() => {
        dispatch(clearAnimals());
    }, [dispatch]);

    return {
        animals,
        currentAnimal,
        isLoading,
        error,
        getFarmAnimals,
        getAnimalById,
        addAnimal,
        createAnimal: addAnimal,
        editAnimal,
        removeAnimal,
        clearError,
        clearAnimalError: clearError,
        selectAnimal,
        clearAnimals: clearAnimalsList,
    };
};

