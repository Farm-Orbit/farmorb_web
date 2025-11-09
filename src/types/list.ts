export type SortOrder = 'asc' | 'desc';

export interface ListOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  filters?: Record<string, string | string[]>;
}

export interface PaginatedList<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
