import { createClient } from '@/lib/supabase/client';
import { AuditLogEntry, AuditLogList, AuditLogQueryParams } from '@/types/audit';

interface AuditLogRow {
  id: string;
  user_id: string | null;
  farm_id: string | null;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  changes: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  user: Record<string, unknown> | null;
}

const SELECT_COLUMNS = `
  id, user_id, farm_id, action_type, entity_type, entity_id,
  old_values, new_values, changes, ip_address, user_agent, request_id,
  metadata, created_at,
  user:profiles ( id, email, first_name, last_name )
`;

const mapAuditLog = (entry: AuditLogRow): AuditLogEntry => ({
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

const SORTABLE_COLUMNS = new Set(['created_at', 'action_type', 'entity_type']);

export const AuditService = {
  getFarmAuditLogs: async (
    farmId: string,
    params?: AuditLogQueryParams
  ): Promise<AuditLogList> => {
    const supabase = createClient();

    let query = supabase
      .from('audit_logs')
      .select(SELECT_COLUMNS, { count: 'exact' })
      .eq('farm_id', farmId);

    if (params?.entityType) {
      query = query.eq('entity_type', params.entityType);
    }
    if (params?.entityId) {
      query = query.eq('entity_id', params.entityId);
    }
    if (params?.actions?.length) {
      query = query.in('action_type', params.actions);
    }
    if (params?.userId) {
      query = query.eq('user_id', params.userId);
    }
    if (params?.start) {
      query = query.gte('created_at', params.start);
    }
    if (params?.end) {
      query = query.lte('created_at', params.end);
    }

    const sortBy = params?.sortBy && SORTABLE_COLUMNS.has(params.sortBy) ? params.sortBy : 'created_at';
    query = query.order(sortBy, { ascending: params?.sortOrder === 'asc' });

    const page = params?.page && params.page > 0 ? params.page : 1;
    const pageSize = params?.pageSize && params.pageSize > 0 ? params.pageSize : 25;
    const from = (page - 1) * pageSize;

    const { data, error, count } = await query.range(from, from + pageSize - 1);
    if (error) {
      throw new Error(error.message);
    }

    const items = ((data ?? []) as unknown as AuditLogRow[]).map(mapAuditLog);

    return {
      items,
      page,
      pageSize,
      total: count ?? items.length,
    };
  },

  getFarmAuditLogById: async (farmId: string, logId: string): Promise<AuditLogEntry> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('audit_logs')
      .select(SELECT_COLUMNS)
      .eq('farm_id', farmId)
      .eq('id', logId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      throw new Error('Audit log not found');
    }

    return mapAuditLog(data as unknown as AuditLogRow);
  },
};
