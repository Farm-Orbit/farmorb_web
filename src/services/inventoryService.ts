import { apiClient } from './api';
import { ApiResponse } from '@/types/api';
import {
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  SupplierList,
  InventoryItem,
  CreateInventoryItemRequest,
  UpdateInventoryItemRequest,
  InventoryItemList,
  InventoryTransaction,
  CreateInventoryTransactionRequest,
  InventoryTransactionList,
} from '@/types/inventory';
import { ListOptions } from '@/types/list';
import { createListSearchParams, normalizePaginatedResponse } from '@/utils/pagination';

export const InventoryService = {
  // Supplier operations
  getSuppliers: async (farmId: string, params?: ListOptions): Promise<SupplierList> => {
    const searchParams = createListSearchParams(params);
    const query = searchParams.toString();
    const url = query ? `/farms/${farmId}/suppliers?${query}` : `/farms/${farmId}/suppliers`;

    const { data } = await apiClient.get<ApiResponse<SupplierList> | SupplierList>(url);
    const payload = 'data' in data && data.data ? data.data : data;

    return normalizePaginatedResponse<Supplier>(payload, params);
  },

  getSupplierById: async (farmId: string, supplierId: string): Promise<Supplier> => {
    const response = await apiClient.get<ApiResponse<Supplier> | Supplier>(
      `/farms/${farmId}/suppliers/${supplierId}`
    );

    if ('data' in response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as Supplier;
  },

  createSupplier: async (farmId: string, payload: CreateSupplierRequest): Promise<Supplier> => {
    const response = await apiClient.post<ApiResponse<Supplier> | Supplier>(
      `/farms/${farmId}/suppliers`,
      payload
    );

    if ('data' in response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as Supplier;
  },

  updateSupplier: async (
    farmId: string,
    supplierId: string,
    payload: UpdateSupplierRequest
  ): Promise<Supplier> => {
    const response = await apiClient.put<ApiResponse<Supplier> | Supplier>(
      `/farms/${farmId}/suppliers/${supplierId}`,
      payload
    );

    if ('data' in response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as Supplier;
  },

  deleteSupplier: async (farmId: string, supplierId: string): Promise<void> => {
    await apiClient.delete(`/farms/${farmId}/suppliers/${supplierId}`);
  },

  // Inventory item operations
  getInventoryItems: async (farmId: string, params?: ListOptions): Promise<InventoryItemList> => {
    const searchParams = createListSearchParams(params);
    const query = searchParams.toString();
    const url = query ? `/farms/${farmId}/inventory?${query}` : `/farms/${farmId}/inventory`;

    const { data } = await apiClient.get<ApiResponse<InventoryItemList> | InventoryItemList>(url);
    const payload = 'data' in data && data.data ? data.data : data;

    return normalizePaginatedResponse<InventoryItem>(payload, params);
  },

  getLowStockItems: async (farmId: string, params?: ListOptions): Promise<InventoryItemList> => {
    const searchParams = createListSearchParams(params);
    const query = searchParams.toString();
    const url = query
      ? `/farms/${farmId}/inventory/low-stock?${query}`
      : `/farms/${farmId}/inventory/low-stock`;

    const { data } = await apiClient.get<ApiResponse<InventoryItemList> | InventoryItemList>(url);
    const payload = 'data' in data && data.data ? data.data : data;

    return normalizePaginatedResponse<InventoryItem>(payload, params);
  },

  getInventoryItemById: async (farmId: string, itemId: string): Promise<InventoryItem> => {
    const response = await apiClient.get<ApiResponse<InventoryItem> | InventoryItem>(
      `/farms/${farmId}/inventory/${itemId}`
    );

    if ('data' in response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as InventoryItem;
  },

  createInventoryItem: async (
    farmId: string,
    payload: CreateInventoryItemRequest
  ): Promise<InventoryItem> => {
    const response = await apiClient.post<ApiResponse<InventoryItem> | InventoryItem>(
      `/farms/${farmId}/inventory`,
      payload
    );

    if ('data' in response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as InventoryItem;
  },

  updateInventoryItem: async (
    farmId: string,
    itemId: string,
    payload: UpdateInventoryItemRequest
  ): Promise<InventoryItem> => {
    const response = await apiClient.put<ApiResponse<InventoryItem> | InventoryItem>(
      `/farms/${farmId}/inventory/${itemId}`,
      payload
    );

    if ('data' in response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as InventoryItem;
  },

  deleteInventoryItem: async (farmId: string, itemId: string): Promise<void> => {
    await apiClient.delete(`/farms/${farmId}/inventory/${itemId}`);
  },

  // Inventory transaction operations
  getInventoryTransactions: async (
    farmId: string,
    itemId: string,
    params?: ListOptions
  ): Promise<InventoryTransactionList> => {
    const searchParams = createListSearchParams(params);
    const query = searchParams.toString();
    const url = query
      ? `/farms/${farmId}/inventory/${itemId}/transactions?${query}`
      : `/farms/${farmId}/inventory/${itemId}/transactions`;

    const { data } = await apiClient.get<
      ApiResponse<InventoryTransactionList> | InventoryTransactionList
    >(url);
    const payload = 'data' in data && data.data ? data.data : data;

    return normalizePaginatedResponse<InventoryTransaction>(payload, params);
  },

  createInventoryTransaction: async (
    farmId: string,
    itemId: string,
    payload: CreateInventoryTransactionRequest
  ): Promise<InventoryTransaction> => {
    const response = await apiClient.post<
      ApiResponse<InventoryTransaction> | InventoryTransaction
    >(`/farms/${farmId}/inventory/${itemId}/transactions`, payload);

    if ('data' in response.data && response.data.data) {
      return response.data.data;
    }
    return response.data as InventoryTransaction;
  },
};

export default InventoryService;

