export interface AuditLogEntry {
  id: string;
  userId?: string | null;
  farmId?: string | null;
  actionType: string;
  entityType: string;
  entityId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  changes?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  user?: Record<string, unknown> | null;
}

export interface AuditLogList {
  items: AuditLogEntry[];
  page: number;
  pageSize: number;
  total: number;
}

export type AuditLogSortOrder = 'asc' | 'desc';

export interface AuditLogQueryParams {
  entityType?: string;
  entityId?: string;
  actions?: string[];
  userId?: string;
  start?: string;
  end?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: AuditLogSortOrder;
  filters?: Record<string, string | string[]>;
}

