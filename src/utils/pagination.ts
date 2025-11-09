import { ListOptions, PaginatedList } from '@/types/list';

export const createListSearchParams = (
  options?: ListOptions,
  extra?: Record<string, string | number | boolean | (string | number | boolean)[] | undefined>
): URLSearchParams => {
  const searchParams = new URLSearchParams();

  if (extra) {
    Object.entries(extra).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      if (Array.isArray(value)) {
        value
          .filter((entry) => entry !== undefined && entry !== null)
          .forEach((entry) => searchParams.append(key, String(entry)));
      } else {
        searchParams.append(key, String(value));
      }
    });
  }

  if (options?.page && options.page > 0) {
    searchParams.append('page', String(options.page));
  }

  if (options?.pageSize && options.pageSize > 0) {
    searchParams.append('page_size', String(options.pageSize));
  }

  if (options?.sortBy) {
    searchParams.append('sort_by', options.sortBy);
  }

  if (options?.sortOrder) {
    searchParams.append('sort_order', options.sortOrder);
  }

  if (options?.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      if (Array.isArray(value)) {
        value
          .filter((entry) => entry !== undefined && entry !== null && entry !== '')
          .forEach((entry) => searchParams.append(`filter[${key}]`, String(entry)));
      } else {
        searchParams.append(`filter[${key}]`, String(value));
      }
    });
  }

  return searchParams;
};

export const normalizePaginatedResponse = <T>(payload: any, fallback?: ListOptions): PaginatedList<T> => {
  const items: T[] = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
    ? payload
    : [];

  const pageFromPayload = typeof payload?.page === 'number' ? payload.page : undefined;
  const pageFromFallback = typeof fallback?.page === 'number' ? fallback.page : undefined;
  const page = pageFromPayload ?? pageFromFallback ?? 1;

  const pageSizeFromPayload =
    typeof payload?.page_size === 'number'
      ? payload.page_size
      : typeof payload?.pageSize === 'number'
      ? payload.pageSize
      : undefined;
  const pageSizeFromFallback =
    typeof fallback?.pageSize === 'number' ? fallback.pageSize : undefined;
  const pageSize = pageSizeFromPayload ?? pageSizeFromFallback ?? items.length;

  const total = typeof payload?.total === 'number' ? payload.total : items.length;

  return {
    items,
    page,
    pageSize,
    total,
  };
};
