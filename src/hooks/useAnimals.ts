import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchHerdAnimals,
    fetchAnimalById,
    createAnimal,
    updateAnimal,
    deleteAnimal,
    clearAnimalError,
    setCurrentAnimal,
    clearAnimals,
} from '@/store/slices/animalSlice';
import { Animal, CreateAnimalData } from '@/types/animal';
import { useCallback } from 'react';

export const useAnimals = () => {
    const dispatch = useAppDispatch();
    const { animals, currentAnimal, isLoading, error } = useAppSelector((state) => state.animals);

    const getHerdAnimals = useCallback(
        (farmId: string, herdId: string) => {
            dispatch(fetchHerdAnimals({ farmId, herdId }));
        },
        [dispatch]
    );

    const getAnimalById = useCallback(
        (farmId: string, animalId: string) => {
            dispatch(fetchAnimalById({ farmId, animalId }));
        },
        [dispatch]
    );

    const addAnimal = useCallback(
        (farmId: string, herdId: string, animalData: CreateAnimalData) => {
            return dispatch(createAnimal({ farmId, herdId, data: animalData })).unwrap();
        },
        [dispatch]
    );

    const editAnimal = useCallback(
        (farmId: string, animalId: string, data: Partial<CreateAnimalData & { status?: string; herd_id?: string }>) => {
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
        getHerdAnimals,
        getAnimalById,
        addAnimal,
        editAnimal,
        removeAnimal,
        clearError,
        clearAnimalError: clearError,
        selectAnimal,
        clearAnimals: clearAnimalsList,
    };
};

