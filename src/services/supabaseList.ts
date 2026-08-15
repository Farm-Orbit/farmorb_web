import { ListOptions, PaginatedList } from '@/types/list';

/**
 * Shared translation of the tables' `ListOptions` into PostgREST query calls.
 *
 * The Go API accepted `page` / `page_size` / `sort_by` / `sort_order` /
 * `filter[col]` as query parameters and returned `{ items, page, page_size,
 * total }`. PostgREST expresses the same thing through `.order()`, `.range()`
 * and an exact count, so the services keep their existing signatures and the
 * tables above them do not change.
 */
export interface ListQueryConfig {
  /** Filter keys matched as a case-insensitive substring instead of equality. */
  textFilters?: string[];
  defaultSort?: { column: string; ascending?: boolean };
}

/** Structural subset of PostgrestFilterBuilder that this helper needs. */
interface QueryBuilder {
  eq(column: string, value: unknown): QueryBuilder;
  in(column: string, values: readonly unknown[]): QueryBuilder;
  ilike(column: string, pattern: string): QueryBuilder;
  order(column: string, options: { ascending: boolean }): QueryBuilder;
  range(from: number, to: number): PromiseLike<{
    data: unknown[] | null;
    error: { message: string } | null;
    count: number | null;
  }>;
}

export function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

/**
 * Applies filters, sorting and paging, then runs the query.
 *
 * `query` must already carry `{ count: 'exact' }` on its select so `total`
 * reflects the whole filtered set rather than the current page.
 */
export async function fetchList<T>(
  query: QueryBuilder,
  options?: ListOptions,
  config: ListQueryConfig = {}
): Promise<PaginatedList<T>> {
  const { textFilters = [], defaultSort } = config;

  let builder = query;

  Object.entries(options?.filters ?? {}).forEach(([column, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      const values = value.filter((entry) => entry !== undefined && entry !== null && entry !== '');
      if (values.length === 0) {
        return;
      }
      // A multi-value text filter still has to match on substring, so it
      // becomes an OR of ilikes rather than an `in`.
      builder = textFilters.includes(column)
        ? values.reduce<QueryBuilder>((acc, entry) => acc.ilike(column, `%${entry}%`), builder)
        : builder.in(column, values);
      return;
    }

    builder = textFilters.includes(column)
      ? builder.ilike(column, `%${value}%`)
      : builder.eq(column, value);
  });

  const sortColumn = options?.sortBy ?? defaultSort?.column;
  if (sortColumn) {
    const ascending = options?.sortBy
      ? options.sortOrder !== 'desc'
      : defaultSort?.ascending ?? true;
    builder = builder.order(sortColumn, { ascending });
  }

  const page = options?.page && options.page > 0 ? options.page : 1;
  const pageSize = options?.pageSize && options.pageSize > 0 ? options.pageSize : 25;
  const from = (page - 1) * pageSize;

  const { data, error, count } = await builder.range(from, from + pageSize - 1);
  throwIfError(error);

  const items = (data ?? []) as T[];

  return {
    items,
    page,
    pageSize,
    total: count ?? items.length,
  };
}

/** Drops undefined keys so a partial update never nulls a column by accident. */
export function definedFields<T extends Record<string, unknown>>(payload: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

/** The id of the signed-in user, for `performed_by` / `added_by` columns. */
export async function currentUserId(
  supabase: { auth: { getUser(): Promise<{ data: { user: { id: string } | null } }> } }
): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
