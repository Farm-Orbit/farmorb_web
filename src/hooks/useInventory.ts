import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearInventoryError,
  clearInventoryState,
  createSupplier,
  createInventoryItem,
  createInventoryTransaction,
  deleteSupplier,
  deleteInventoryItem,
  fetchSupplierById,
  fetchSuppliers,
  fetchInventoryItemById,
  fetchInventoryItems,
  fetchLowStockItems,
  fetchInventoryTransactions,
  setCurrentSupplier,
  setCurrentItem,
  updateSupplier,
  updateInventoryItem,
} from '@/store/slices/inventorySlice';
import {
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  InventoryItem,
  CreateInventoryItemRequest,
  UpdateInventoryItemRequest,
  CreateInventoryTransactionRequest,
} from '@/types/inventory';
import { ListOptions } from '@/types/list';

export const useInventory = () => {
  const dispatch = useAppDispatch();
  const {
    suppliers,
    inventoryItems,
    transactions,
    currentSupplier,
    currentItem,
    suppliersTotal,
    suppliersPage,
    suppliersPageSize,
    itemsTotal,
    itemsPage,
    itemsPageSize,
    transactionsTotal,
    transactionsPage,
    transactionsPageSize,
    isLoadingSuppliers,
    isLoadingItems,
    isLoadingTransactions,
    error,
  } = useAppSelector((state) => state.inventory);

  // Supplier operations
  const getSuppliers = useCallback(
    (farmId: string, params?: ListOptions) =>
      dispatch(fetchSuppliers({ farmId, params })).unwrap(),
    [dispatch]
  );

  const getSupplierById = useCallback(
    (farmId: string, supplierId: string) =>
      dispatch(fetchSupplierById({ farmId, supplierId })).unwrap(),
    [dispatch]
  );

  const addSupplier = useCallback(
    (farmId: string, data: CreateSupplierRequest) =>
      dispatch(createSupplier({ farmId, data })).unwrap(),
    [dispatch]
  );

  const editSupplier = useCallback(
    (farmId: string, supplierId: string, data: UpdateSupplierRequest) =>
      dispatch(updateSupplier({ farmId, supplierId, data })).unwrap(),
    [dispatch]
  );

  const removeSupplier = useCallback(
    (farmId: string, supplierId: string) =>
      dispatch(deleteSupplier({ farmId, supplierId })).unwrap(),
    [dispatch]
  );

  // Inventory item operations
  const getInventoryItems = useCallback(
    (farmId: string, params?: ListOptions) =>
      dispatch(fetchInventoryItems({ farmId, params })).unwrap(),
    [dispatch]
  );

  const getLowStockItems = useCallback(
    (farmId: string, params?: ListOptions) =>
      dispatch(fetchLowStockItems({ farmId, params })).unwrap(),
    [dispatch]
  );

  const getInventoryItemById = useCallback(
    (farmId: string, itemId: string) =>
      dispatch(fetchInventoryItemById({ farmId, itemId })).unwrap(),
    [dispatch]
  );

  const addInventoryItem = useCallback(
    (farmId: string, data: CreateInventoryItemRequest) =>
      dispatch(createInventoryItem({ farmId, data })).unwrap(),
    [dispatch]
  );

  const editInventoryItem = useCallback(
    (farmId: string, itemId: string, data: UpdateInventoryItemRequest) =>
      dispatch(updateInventoryItem({ farmId, itemId, data })).unwrap(),
    [dispatch]
  );

  const removeInventoryItem = useCallback(
    (farmId: string, itemId: string) =>
      dispatch(deleteInventoryItem({ farmId, itemId })).unwrap(),
    [dispatch]
  );

  // Transaction operations
  const getInventoryTransactions = useCallback(
    (farmId: string, itemId: string, params?: ListOptions) =>
      dispatch(fetchInventoryTransactions({ farmId, itemId, params })).unwrap(),
    [dispatch]
  );

  const addInventoryTransaction = useCallback(
    (farmId: string, itemId: string, data: CreateInventoryTransactionRequest) =>
      dispatch(createInventoryTransaction({ farmId, itemId, data })).unwrap(),
    [dispatch]
  );

  // Selection operations
  const selectSupplier = useCallback(
    (supplier: Supplier | null) => {
      dispatch(setCurrentSupplier(supplier));
    },
    [dispatch]
  );

  const selectInventoryItem = useCallback(
    (item: InventoryItem | null) => {
      dispatch(setCurrentItem(item));
    },
    [dispatch]
  );

  const resetInventoryState = useCallback(() => {
    dispatch(clearInventoryState());
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearInventoryError());
  }, [dispatch]);

  return {
    suppliers,
    inventoryItems,
    transactions,
    currentSupplier,
    currentItem,
    suppliersTotal,
    suppliersPage,
    suppliersPageSize,
    itemsTotal,
    itemsPage,
    itemsPageSize,
    transactionsTotal,
    transactionsPage,
    transactionsPageSize,
    isLoadingSuppliers,
    isLoadingItems,
    isLoadingTransactions,
    error,
    getSuppliers,
    getSupplierById,
    addSupplier,
    editSupplier,
    removeSupplier,
    getInventoryItems,
    getLowStockItems,
    getInventoryItemById,
    addInventoryItem,
    editInventoryItem,
    removeInventoryItem,
    getInventoryTransactions,
    addInventoryTransaction,
    selectSupplier,
    selectInventoryItem,
    resetInventoryState,
    clearError,
  } as const;
};

export type UseInventoryHook = ReturnType<typeof useInventory>;

