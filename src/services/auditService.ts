import { apiClient } from './api';
import { handleApiError } from './api';
import { AuditLogEntry, AuditLogList, AuditLogQueryParams } from '@/types/audit';

interface AuditLogApiEntry {
  id: string;
  user_id?: string | null;
  farm_id?: string | null;
  action_type: string;
  entity_type: string;
  entity_id?: string | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  changes?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  request_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  user?: Record<string, unknown> | null;
}

interface AuditLogResponsePayload {
  items?: AuditLogApiEntry[];
  page?: number;
  page_size?: number;
  total?: number;
}

interface AuditLogsApiResponse {
  success: boolean;
  message?: string;
  data?: AuditLogResponsePayload;
}

const mapAuditLog = (entry: AuditLogApiEntry): AuditLogEntry => ({
  id: entry.id,
  userId: entry.user_id ?? null,
  farmId: entry.farm_id ?? null,
  actionType: entry.action_type,
  entityType: entry.entity_type,
  entityId: entry.entity_id ?? null,
  oldValues: entry.old_values ?? null,
  newValues: entry.new_values ?? null,
  changes: entry.changes ?? null,
  ipAddress: entry.ip_address ?? null,
  userAgent: entry.user_agent ?? null,
  requestId: entry.request_id ?? null,
  metadata: entry.metadata
    ? Object.keys(entry.metadata).reduce<Record<string, unknown>>((metadata, key) => {
        const value = entry.metadata?.[key];
        if (value === undefined || value === null || value === '') {
          return metadata;
        }
        metadata[key] = value;
        return metadata;
      }, {})
    : null,
  createdAt: entry.created_at,
  user: entry.user ?? null,
});

export const AuditService = {
  getFarmAuditLogs: async (farmId: string, params?: AuditLogQueryParams): Promise<AuditLogList> => {
    try {
      const searchParams = new URLSearchParams();

      if (params?.entityType) {
        searchParams.append('entity_type', params.entityType);
      }
      if (params?.entityId) {
        searchParams.append('entity_id', params.entityId);
      }
      if (params?.actions?.length) {
        searchParams.append('actions', params.actions.join(','));
      }
      if (params?.userId) {
        searchParams.append('user_id', params.userId);
      }
      if (params?.start) {
        searchParams.append('start', params.start);
      }
      if (params?.end) {
        searchParams.append('end', params.end);
      }

      const page = params?.page && params.page > 0 ? params.page : undefined;
      const pageSize = params?.pageSize && params.pageSize > 0 ? params.pageSize : undefined;

      if (page) {
        searchParams.append('page', String(page));
      }
      if (pageSize) {
        searchParams.append('page_size', String(pageSize));
      }

      if (params?.sortBy) {
        searchParams.append('sort_by', params.sortBy);
      }
      if (params?.sortOrder) {
        searchParams.append('sort_order', params.sortOrder);
      }

      if (params?.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.filter(Boolean).forEach((item) => {
              searchParams.append(`filter[${key}]`, String(item));
            });
          } else if (value !== undefined && value !== null && value !== '') {
            searchParams.append(`filter[${key}]`, String(value));
          }
        });
      }

      const queryString = searchParams.toString();
      const endpoint = `/farms/${farmId}/audit-logs${queryString ? `?${queryString}` : ''}`;
      const { data } = await apiClient.get<AuditLogsApiResponse>(endpoint);
      const payload = data?.data;

      const items = (payload?.items ?? []).map(mapAuditLog);
      const effectivePage = payload?.page ?? page ?? 1;
      const effectivePageSize = payload?.page_size ?? pageSize ?? 25;
      const total = payload?.total ?? items.length;

      return {
        items,
        page: effectivePage,
        pageSize: effectivePageSize,
        total,
      };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getFarmAuditLogById: async (farmId: string, logId: string): Promise<AuditLogEntry> => {
    const pageSize = 50;
    let page = 1;

    try {
      for (;;) {
        const { items, total, pageSize: responsePageSize } = await AuditService.getFarmAuditLogs(farmId, {
          page,
          pageSize,
        });

        const match = items.find((log) => log.id === logId);
        if (match) {
          return match;
        }

        const effectivePageSize = responsePageSize > 0 ? responsePageSize : pageSize;
        const totalPages = effectivePageSize > 0 && total > 0 ? Math.ceil(total / effectivePageSize) : 0;

        if (items.length === 0 || totalPages === 0 || page >= totalPages) {
          break;
        }

        page += 1;
      }
    } catch (error) {
      throw new Error(handleApiError(error));
    }

    throw new Error('Audit log not found');
  },
};

