import { useSearchParams } from 'react-router-dom';
import { useDebounce } from './useDebounce';
import type { ProductFilters, SortBy, SortOrder } from '../types/product';

const DEFAULT_SORT_BY: SortBy = 'createdAt';
const DEFAULT_SORT_ORDER: SortOrder = 'desc';

function readFilters(searchParams: URLSearchParams): ProductFilters {
  return {
    search: searchParams.get('search') ?? '',
    categoryId: searchParams.get('categoryId') ?? '',
    minPrice: searchParams.get('minPrice') ?? '',
    maxPrice: searchParams.get('maxPrice') ?? '',
    minRating: searchParams.get('minRating') ?? '',
    sortBy: (searchParams.get('sortBy') as SortBy) || DEFAULT_SORT_BY,
    sortOrder: (searchParams.get('sortOrder') as SortOrder) || DEFAULT_SORT_ORDER,
    page: Number(searchParams.get('page')) || 1,
    storeId: searchParams.get('storeId') ?? '',
  };
}

/**
 * Reads/writes product filters to URL query params so the page is
 * shareable and bookmarkable. The `search` field is debounced before
 * it's written to the URL (and therefore before it triggers a refetch);
 * every other field updates immediately.
 */
export function useProductFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readFilters(searchParams);

  // Debounce just the search text, written to the URL only after 300ms idle.
  const debouncedSearch = useDebounce(filters.search, 300);

  function updateParams(next: Partial<ProductFilters>, resetPage = true) {
    const merged: ProductFilters = { ...filters, ...next };
    if (resetPage && !('page' in next)) {
      merged.page = 1;
    }

    const params = new URLSearchParams();
    if (merged.search) params.set('search', merged.search);
    if (merged.categoryId) params.set('categoryId', merged.categoryId);
    if (merged.minPrice) params.set('minPrice', merged.minPrice);
    if (merged.maxPrice) params.set('maxPrice', merged.maxPrice);
    if (merged.minRating) params.set('minRating', merged.minRating);
    if (merged.storeId) params.set('storeId', merged.storeId);
    if (merged.sortBy !== DEFAULT_SORT_BY) params.set('sortBy', merged.sortBy);
    if (merged.sortOrder !== DEFAULT_SORT_ORDER) params.set('sortOrder', merged.sortOrder);
    if (merged.page !== 1) params.set('page', String(merged.page));

    setSearchParams(params, { replace: true });
  }

  function resetFilters() {
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  return {
    filters,
    debouncedSearch,
    setSearch: (value: string) => updateParams({ search: value }, false), // page reset happens after debounce fires below
    setCategoryId: (value: string) => updateParams({ categoryId: value }),
    setMinPrice: (value: string) => updateParams({ minPrice: value }),
    setMaxPrice: (value: string) => updateParams({ maxPrice: value }),
    setMinRating: (value: string) => updateParams({ minRating: value }),
    setStoreId: (value: string) => updateParams({ storeId: value }),
    setSort: (sortBy: SortBy, sortOrder: SortOrder) => updateParams({ sortBy, sortOrder }),
    setPage: (page: number) => updateParams({ page }, false),
    resetFilters,
  };
}