import { ListOptions } from '@/types/list';

export interface TablePaginationState {
  pageIndex: number;
  pageSize: number;
}

export interface TableSortingStateItem {
  id: string;
  desc: boolean;
}

export interface TableColumnFilterStateItem {
  id: string;
  value: unknown;
}

export interface BuildListOptionsArgs {
  paginationState: TablePaginationState;
  sortingState: TableSortingStateItem[];
  columnFiltersState: TableColumnFilterStateItem[];
  sortColumnMap?: Record<string, string>;
  filterColumnMap?: Record<string, string>;
  extraFilters?: Record<string, unknown>;
}

const isNil = (value: unknown): boolean => value === null || value === undefined;

const normalizeFilterValue = (value: unknown): string | string[] | undefined => {
  if (isNil(value) || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (Array.isArray(value)) {
    const entries = value
      .flatMap((entry) => (Array.isArray(entry) ? entry : [entry]))
      .filter((entry) => !isNil(entry) && entry !== '')
      .map((entry) => String(entry));

    return entries.length ? entries : undefined;
  }

  return String(value);
};

export const buildListOptions = ({
  paginationState,
  sortingState,
  columnFiltersState,
  sortColumnMap = {},
  filterColumnMap = {},
  extraFilters = {},
}: BuildListOptionsArgs): ListOptions => {
  const options: ListOptions = {
    page: Math.max(paginationState.pageIndex + 1, 1),
    pageSize: Math.max(paginationState.pageSize, 1),
  };

  const primarySort = sortingState[0];
  if (primarySort) {
    const sortColumn = sortColumnMap[primarySort.id] ?? primarySort.id;
    if (sortColumn) {
      options.sortBy = sortColumn;
      options.sortOrder = primarySort.desc ? 'desc' : 'asc';
    }
  }

  const filters: Record<string, string | string[]> = {};

  Object.entries(extraFilters).forEach(([key, value]) => {
    const normalized = normalizeFilterValue(value);
    if (!normalized) {
      return;
    }
    filters[key] = normalized;
  });

  columnFiltersState.forEach(({ id, value }) => {
    const filterKey = filterColumnMap[id];
    if (!filterKey) {
      return;
    }

    const normalized = normalizeFilterValue(value);
    if (!normalized) {
      return;
    }

    filters[filterKey] = normalized;
  });

  if (Object.keys(filters).length > 0) {
    options.filters = filters;
  }

  return options;
};
