import { createClient } from '@/lib/supabase/client';
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
import { currentUserId, definedFields, fetchList, throwIfError } from './supabaseList';

const SUPPLIER_TEXT_FILTERS = ['name', 'address', 'notes'];
const ITEM_TEXT_FILTERS = ['name', 'unit', 'notes'];

export const InventoryService = {
  // Supplier operations
  getSuppliers: async (farmId: string, params?: ListOptions): Promise<SupplierList> => {
    const supabase = createClient();
    const query = supabase
      .from('suppliers')
      .select('*', { count: 'exact' })
      .eq('farm_id', farmId);

    return fetchList<Supplier>(query, params, {
      textFilters: SUPPLIER_TEXT_FILTERS,
      defaultSort: { column: 'name', ascending: true },
    });
  },

  getSupplierById: async (farmId: string, supplierId: string): Promise<Supplier> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('farm_id', farmId)
      .eq('id', supplierId)
      .single();
    throwIfError(error);
    return data as Supplier;
  },

  createSupplier: async (farmId: string, payload: CreateSupplierRequest): Promise<Supplier> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        ...definedFields(payload as unknown as Record<string, unknown>),
        farm_id: farmId,
        contact_info: payload.contact_info ?? {},
      })
      .select('*')
      .single();
    throwIfError(error);
    return data as Supplier;
  },

  updateSupplier: async (
    farmId: string,
    supplierId: string,
    payload: UpdateSupplierRequest
  ): Promise<Supplier> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('suppliers')
      .update(definedFields(payload as Record<string, unknown>))
      .eq('farm_id', farmId)
      .eq('id', supplierId)
      .select('*')
      .single();
    throwIfError(error);
    return data as Supplier;
  },

  deleteSupplier: async (farmId: string, supplierId: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('farm_id', farmId)
      .eq('id', supplierId);
    throwIfError(error);
  },

  // Inventory item operations
  getInventoryItems: async (farmId: string, params?: ListOptions): Promise<InventoryItemList> => {
    const supabase = createClient();
    const query = supabase
      .from('inventory_items')
      .select('*', { count: 'exact' })
      .eq('farm_id', farmId);

    return fetchList<InventoryItem>(query, params, {
      textFilters: ITEM_TEXT_FILTERS,
      defaultSort: { column: 'name', ascending: true },
    });
  },

  getLowStockItems: async (farmId: string, params?: ListOptions): Promise<InventoryItemList> => {
    const supabase = createClient();
    // is_low_stock is a generated column; see the livestock migration.
    const query = supabase
      .from('inventory_items')
      .select('*', { count: 'exact' })
      .eq('farm_id', farmId)
      .eq('is_low_stock', true);

    return fetchList<InventoryItem>(query, params, {
      textFilters: ITEM_TEXT_FILTERS,
      defaultSort: { column: 'name', ascending: true },
    });
  },

  getInventoryItemById: async (farmId: string, itemId: string): Promise<InventoryItem> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('farm_id', farmId)
      .eq('id', itemId)
      .single();
    throwIfError(error);
    return data as InventoryItem;
  },

  createInventoryItem: async (
    farmId: string,
    payload: CreateInventoryItemRequest
  ): Promise<InventoryItem> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('inventory_items')
      .insert({ ...definedFields(payload as unknown as Record<string, unknown>), farm_id: farmId })
      .select('*')
      .single();
    throwIfError(error);
    return data as InventoryItem;
  },

  updateInventoryItem: async (
    farmId: string,
    itemId: string,
    payload: UpdateInventoryItemRequest
  ): Promise<InventoryItem> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('inventory_items')
      .update(definedFields(payload as Record<string, unknown>))
      .eq('farm_id', farmId)
      .eq('id', itemId)
      .select('*')
      .single();
    throwIfError(error);
    return data as InventoryItem;
  },

  deleteInventoryItem: async (farmId: string, itemId: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('farm_id', farmId)
      .eq('id', itemId);
    throwIfError(error);
  },

  // Inventory transaction operations
  getInventoryTransactions: async (
    farmId: string,
    itemId: string,
    params?: ListOptions
  ): Promise<InventoryTransactionList> => {
    const supabase = createClient();
    const query = supabase
      .from('inventory_transactions')
      .select('*', { count: 'exact' })
      .eq('farm_id', farmId)
      .eq('inventory_item_id', itemId);

    return fetchList<InventoryTransaction>(query, params, {
      textFilters: ['notes'],
      defaultSort: { column: 'created_at', ascending: false },
    });
  },

  createInventoryTransaction: async (
    farmId: string,
    itemId: string,
    payload: CreateInventoryTransactionRequest
  ): Promise<InventoryTransaction> => {
    const supabase = createClient();
    const userId = await currentUserId(supabase);
    // inventory_items.quantity is adjusted by a trigger on this insert.
    const { data, error } = await supabase
      .from('inventory_transactions')
      .insert({
        ...definedFields(payload as unknown as Record<string, unknown>),
        farm_id: farmId,
        inventory_item_id: itemId,
        performed_by: userId,
      })
      .select('*')
      .single();
    throwIfError(error);
    return data as InventoryTransaction;
  },
};

export default InventoryService;
