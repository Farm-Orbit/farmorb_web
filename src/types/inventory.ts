import { PaginatedList } from '@/types/list';

export type InventoryCategory = 'feed' | 'medication' | 'equipment' | 'supplies' | 'other';
export type TransactionType = 'purchase' | 'usage' | 'restock' | 'adjustment' | 'loss';

export interface Supplier {
  id: string;
  farm_id: string;
  name: string;
  contact_info?: Record<string, any> | null;
  address?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierRequest {
  name: string;
  contact_info?: Record<string, any>;
  address?: string | null;
  notes?: string | null;
}

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {}

export interface InventoryItem {
  id: string;
  farm_id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  cost_per_unit?: number | null;
  supplier_id?: string | null;
  expiry_date?: string | null;
  low_stock_threshold?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateInventoryItemRequest {
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  cost_per_unit?: number | null;
  supplier_id?: string | null;
  expiry_date?: string | null;
  low_stock_threshold?: number | null;
  notes?: string | null;
}

export interface UpdateInventoryItemRequest extends Partial<CreateInventoryItemRequest> {}

export interface InventoryTransaction {
  id: string;
  farm_id: string;
  inventory_item_id: string;
  transaction_type: TransactionType;
  quantity: number;
  cost?: number | null;
  supplier_id?: string | null;
  notes?: string | null;
  performed_by?: string | null;
  created_at: string;
}

export interface CreateInventoryTransactionRequest {
  inventory_item_id: string;
  transaction_type: TransactionType;
  quantity: number;
  cost?: number | null;
  supplier_id?: string | null;
  notes?: string | null;
}

export type SupplierList = PaginatedList<Supplier>;
export type InventoryItemList = PaginatedList<InventoryItem>;
export type InventoryTransactionList = PaginatedList<InventoryTransaction>;

