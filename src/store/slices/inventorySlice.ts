import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { InventoryService } from '@/services/inventoryService';
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
import { ListOptions, SortOrder } from '@/types/list';

interface SuppliersPayload extends SupplierList {
  sortBy?: string;
  sortOrder?: SortOrder;
  filters?: Record<string, string | string[]>;
}

interface InventoryItemsPayload extends InventoryItemList {
  sortBy?: string;
  sortOrder?: SortOrder;
  filters?: Record<string, string | string[]>;
}

interface InventoryTransactionsPayload extends InventoryTransactionList {
  sortBy?: string;
  sortOrder?: SortOrder;
  filters?: Record<string, string | string[]>;
}

interface InventoryState {
  suppliers: Supplier[];
  inventoryItems: InventoryItem[];
  transactions: InventoryTransaction[];
  currentSupplier: Supplier | null;
  currentItem: InventoryItem | null;
  suppliersTotal: number;
  suppliersPage: number;
  suppliersPageSize: number;
  itemsTotal: number;
  itemsPage: number;
  itemsPageSize: number;
  transactionsTotal: number;
  transactionsPage: number;
  transactionsPageSize: number;
  isLoadingSuppliers: boolean;
  isLoadingItems: boolean;
  isLoadingTransactions: boolean;
  error: string | null;
}

const initialState: InventoryState = {
  suppliers: [],
  inventoryItems: [],
  transactions: [],
  currentSupplier: null,
  currentItem: null,
  suppliersTotal: 0,
  suppliersPage: 1,
  suppliersPageSize: 10,
  itemsTotal: 0,
  itemsPage: 1,
  itemsPageSize: 10,
  transactionsTotal: 0,
  transactionsPage: 1,
  transactionsPageSize: 10,
  isLoadingSuppliers: false,
  isLoadingItems: false,
  isLoadingTransactions: false,
  error: null,
};

// Supplier thunks
export const fetchSuppliers = createAsyncThunk<
  SuppliersPayload,
  { farmId: string; params?: ListOptions },
  { rejectValue: string }
>('inventory/fetchSuppliers', async ({ farmId, params }, { rejectWithValue }) => {
  try {
    const result = await InventoryService.getSuppliers(farmId, params);
    return {
      ...result,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      filters: params?.filters,
    };
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to load suppliers');
  }
});

export const fetchSupplierById = createAsyncThunk<
  Supplier,
  { farmId: string; supplierId: string },
  { rejectValue: string }
>('inventory/fetchSupplierById', async ({ farmId, supplierId }, { rejectWithValue }) => {
  try {
    return await InventoryService.getSupplierById(farmId, supplierId);
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to load supplier');
  }
});

export const createSupplier = createAsyncThunk<
  Supplier,
  { farmId: string; data: CreateSupplierRequest },
  { rejectValue: string }
>('inventory/createSupplier', async ({ farmId, data }, { rejectWithValue }) => {
  try {
    return await InventoryService.createSupplier(farmId, data);
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to create supplier');
  }
});

export const updateSupplier = createAsyncThunk<
  Supplier,
  { farmId: string; supplierId: string; data: UpdateSupplierRequest },
  { rejectValue: string }
>('inventory/updateSupplier', async ({ farmId, supplierId, data }, { rejectWithValue }) => {
  try {
    return await InventoryService.updateSupplier(farmId, supplierId, data);
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to update supplier');
  }
});

export const deleteSupplier = createAsyncThunk<
  string,
  { farmId: string; supplierId: string },
  { rejectValue: string }
>('inventory/deleteSupplier', async ({ farmId, supplierId }, { rejectWithValue }) => {
  try {
    await InventoryService.deleteSupplier(farmId, supplierId);
    return supplierId;
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to delete supplier');
  }
});

// Inventory item thunks
export const fetchInventoryItems = createAsyncThunk<
  InventoryItemsPayload,
  { farmId: string; params?: ListOptions },
  { rejectValue: string }
>('inventory/fetchItems', async ({ farmId, params }, { rejectWithValue }) => {
  try {
    const result = await InventoryService.getInventoryItems(farmId, params);
    return {
      ...result,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      filters: params?.filters,
    };
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to load inventory items');
  }
});

export const fetchLowStockItems = createAsyncThunk<
  InventoryItemsPayload,
  { farmId: string; params?: ListOptions },
  { rejectValue: string }
>('inventory/fetchLowStockItems', async ({ farmId, params }, { rejectWithValue }) => {
  try {
    const result = await InventoryService.getLowStockItems(farmId, params);
    return {
      ...result,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      filters: params?.filters,
    };
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to load low stock items');
  }
});

export const fetchInventoryItemById = createAsyncThunk<
  InventoryItem,
  { farmId: string; itemId: string },
  { rejectValue: string }
>('inventory/fetchItemById', async ({ farmId, itemId }, { rejectWithValue }) => {
  try {
    return await InventoryService.getInventoryItemById(farmId, itemId);
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to load inventory item');
  }
});

export const createInventoryItem = createAsyncThunk<
  InventoryItem,
  { farmId: string; data: CreateInventoryItemRequest },
  { rejectValue: string }
>('inventory/createItem', async ({ farmId, data }, { rejectWithValue }) => {
  try {
    return await InventoryService.createInventoryItem(farmId, data);
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to create inventory item');
  }
});

export const updateInventoryItem = createAsyncThunk<
  InventoryItem,
  { farmId: string; itemId: string; data: UpdateInventoryItemRequest },
  { rejectValue: string }
>('inventory/updateItem', async ({ farmId, itemId, data }, { rejectWithValue }) => {
  try {
    return await InventoryService.updateInventoryItem(farmId, itemId, data);
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to update inventory item');
  }
});

export const deleteInventoryItem = createAsyncThunk<
  string,
  { farmId: string; itemId: string },
  { rejectValue: string }
>('inventory/deleteItem', async ({ farmId, itemId }, { rejectWithValue }) => {
  try {
    await InventoryService.deleteInventoryItem(farmId, itemId);
    return itemId;
  } catch (error: any) {
    return rejectWithValue(error?.error || error?.message || 'Failed to delete inventory item');
  }
});

// Transaction thunks
export const fetchInventoryTransactions = createAsyncThunk<
  InventoryTransactionsPayload,
  { farmId: string; itemId: string; params?: ListOptions },
  { rejectValue: string }
>('inventory/fetchTransactions', async ({ farmId, itemId, params }, { rejectWithValue }) => {
  try {
    const result = await InventoryService.getInventoryTransactions(farmId, itemId, params);
    return {
      ...result,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      filters: params?.filters,
    };
  } catch (error: any) {
    return rejectWithValue(
      error?.error || error?.message || 'Failed to load inventory transactions'
    );
  }
});

export const createInventoryTransaction = createAsyncThunk<
  InventoryTransaction,
  { farmId: string; itemId: string; data: CreateInventoryTransactionRequest },
  { rejectValue: string }
>('inventory/createTransaction', async ({ farmId, itemId, data }, { rejectWithValue }) => {
  try {
    return await InventoryService.createInventoryTransaction(farmId, itemId, data);
  } catch (error: any) {
    return rejectWithValue(
      error?.error || error?.message || 'Failed to create inventory transaction'
    );
  }
});

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearInventoryError: (state) => {
      state.error = null;
    },
    setCurrentSupplier: (state, action: PayloadAction<Supplier | null>) => {
      state.currentSupplier = action.payload;
    },
    setCurrentItem: (state, action: PayloadAction<InventoryItem | null>) => {
      state.currentItem = action.payload;
    },
    clearInventoryState: () => ({ ...initialState }),
  },
  extraReducers: (builder) => {
    builder
      // Suppliers
      .addCase(fetchSuppliers.pending, (state) => {
        state.isLoadingSuppliers = true;
        state.error = null;
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.isLoadingSuppliers = false;
        state.suppliers = action.payload.items;
        state.suppliersTotal = action.payload.total;
        state.suppliersPage = action.payload.page;
        state.suppliersPageSize = action.payload.pageSize;
      })
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.isLoadingSuppliers = false;
        state.error = action.payload || 'Failed to load suppliers';
        state.suppliers = [];
        state.suppliersTotal = 0;
      })
      .addCase(fetchSupplierById.fulfilled, (state, action) => {
        state.currentSupplier = action.payload;
      })
      .addCase(fetchSupplierById.rejected, (state, action) => {
        state.error = action.payload || 'Failed to load supplier';
      })
      .addCase(createSupplier.fulfilled, (state, action) => {
        state.suppliers = [action.payload, ...state.suppliers];
        state.suppliersTotal += 1;
        state.currentSupplier = action.payload;
      })
      .addCase(createSupplier.rejected, (state, action) => {
        state.error = action.payload || 'Failed to create supplier';
      })
      .addCase(updateSupplier.fulfilled, (state, action) => {
        state.suppliers = state.suppliers.map((supplier) =>
          supplier.id === action.payload.id ? action.payload : supplier
        );
        if (state.currentSupplier?.id === action.payload.id) {
          state.currentSupplier = action.payload;
        }
      })
      .addCase(updateSupplier.rejected, (state, action) => {
        state.error = action.payload || 'Failed to update supplier';
      })
      .addCase(deleteSupplier.fulfilled, (state, action) => {
        state.suppliers = state.suppliers.filter((supplier) => supplier.id !== action.payload);
        state.suppliersTotal = Math.max(state.suppliersTotal - 1, 0);
        if (state.currentSupplier?.id === action.payload) {
          state.currentSupplier = null;
        }
      })
      .addCase(deleteSupplier.rejected, (state, action) => {
        state.error = action.payload || 'Failed to delete supplier';
      })
      // Inventory items
      .addCase(fetchInventoryItems.pending, (state) => {
        state.isLoadingItems = true;
        state.error = null;
      })
      .addCase(fetchInventoryItems.fulfilled, (state, action) => {
        state.isLoadingItems = false;
        state.inventoryItems = action.payload.items;
        state.itemsTotal = action.payload.total;
        state.itemsPage = action.payload.page;
        state.itemsPageSize = action.payload.pageSize;
      })
      .addCase(fetchInventoryItems.rejected, (state, action) => {
        state.isLoadingItems = false;
        state.error = action.payload || 'Failed to load inventory items';
        state.inventoryItems = [];
        state.itemsTotal = 0;
      })
      .addCase(fetchLowStockItems.pending, (state) => {
        state.isLoadingItems = true;
        state.error = null;
      })
      .addCase(fetchLowStockItems.fulfilled, (state, action) => {
        state.isLoadingItems = false;
        state.inventoryItems = action.payload.items;
        state.itemsTotal = action.payload.total;
        state.itemsPage = action.payload.page;
        state.itemsPageSize = action.payload.pageSize;
      })
      .addCase(fetchLowStockItems.rejected, (state, action) => {
        state.isLoadingItems = false;
        state.error = action.payload || 'Failed to load low stock items';
        state.inventoryItems = [];
        state.itemsTotal = 0;
      })
      .addCase(fetchInventoryItemById.fulfilled, (state, action) => {
        state.currentItem = action.payload;
      })
      .addCase(fetchInventoryItemById.rejected, (state, action) => {
        state.error = action.payload || 'Failed to load inventory item';
      })
      .addCase(createInventoryItem.fulfilled, (state, action) => {
        state.inventoryItems = [action.payload, ...state.inventoryItems];
        state.itemsTotal += 1;
        state.currentItem = action.payload;
      })
      .addCase(createInventoryItem.rejected, (state, action) => {
        state.error = action.payload || 'Failed to create inventory item';
      })
      .addCase(updateInventoryItem.fulfilled, (state, action) => {
        state.inventoryItems = state.inventoryItems.map((item) =>
          item.id === action.payload.id ? action.payload : item
        );
        if (state.currentItem?.id === action.payload.id) {
          state.currentItem = action.payload;
        }
      })
      .addCase(updateInventoryItem.rejected, (state, action) => {
        state.error = action.payload || 'Failed to update inventory item';
      })
      .addCase(deleteInventoryItem.fulfilled, (state, action) => {
        state.inventoryItems = state.inventoryItems.filter((item) => item.id !== action.payload);
        state.itemsTotal = Math.max(state.itemsTotal - 1, 0);
        if (state.currentItem?.id === action.payload) {
          state.currentItem = null;
        }
      })
      .addCase(deleteInventoryItem.rejected, (state, action) => {
        state.error = action.payload || 'Failed to delete inventory item';
      })
      // Transactions
      .addCase(fetchInventoryTransactions.pending, (state) => {
        state.isLoadingTransactions = true;
        state.error = null;
      })
      .addCase(fetchInventoryTransactions.fulfilled, (state, action) => {
        state.isLoadingTransactions = false;
        state.transactions = action.payload.items;
        state.transactionsTotal = action.payload.total;
        state.transactionsPage = action.payload.page;
        state.transactionsPageSize = action.payload.pageSize;
      })
      .addCase(fetchInventoryTransactions.rejected, (state, action) => {
        state.isLoadingTransactions = false;
        state.error = action.payload || 'Failed to load inventory transactions';
        state.transactions = [];
        state.transactionsTotal = 0;
      })
      .addCase(createInventoryTransaction.fulfilled, (state, action) => {
        state.transactions = [action.payload, ...state.transactions];
        state.transactionsTotal += 1;
        // Update the item quantity if it's in the current list
        const item = state.inventoryItems.find((i) => i.id === action.payload.inventory_item_id);
        if (item) {
          // The backend updates the quantity, so we should refetch the item
          // For now, we'll just mark that a transaction was created
        }
      })
      .addCase(createInventoryTransaction.rejected, (state, action) => {
        state.error = action.payload || 'Failed to create inventory transaction';
      });
  },
});

export const { clearInventoryError, setCurrentSupplier, setCurrentItem, clearInventoryState } =
  inventorySlice.actions;

export default inventorySlice.reducer;

