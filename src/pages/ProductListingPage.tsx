import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, List } from 'lucide-react';
import { fetchCategories, fetchProducts } from '../api/productsApi';
import { useProductFilters } from '../hooks/useProductFilters';
import { ProductCard, type ProductView } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';
import { Pagination } from '../components/Pagination';
import type { SortBy, SortOrder } from '../types/product';

const VIEW_STORAGE_KEY = 'shopit-products-view';

const SORT_OPTIONS: Array<{ value: string; sortBy: SortBy; sortOrder: SortOrder; label: string }> = [
  { value: 'name-asc', sortBy: 'name', sortOrder: 'asc', label: 'Name A-Z' },
  { value: 'name-desc', sortBy: 'name', sortOrder: 'desc', label: 'Name Z-A' },
  { value: 'price-asc', sortBy: 'price', sortOrder: 'asc', label: 'Price Low-High' },
  { value: 'price-desc', sortBy: 'price', sortOrder: 'desc', label: 'Price High-Low' },
  { value: 'createdAt-desc', sortBy: 'createdAt', sortOrder: 'desc', label: 'Newest' },
];

const inkText = { color: '#1F2A24', fontFamily: "'Inter', sans-serif" };
const labelText = {
  color: '#8A8273',
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
};
const inputStyle = {
  ...inkText,
  border: '1px solid #E4DCC9',
  backgroundColor: '#FFFFFF',
};

function ProductListingPage() {
  const { filters, debouncedSearch, setSearch, setCategoryId, setMinPrice, setMaxPrice, setSort, setPage, resetFilters } =
    useProductFilters();

  const [view, setView] = useState<ProductView>(() =>
    localStorage.getItem(VIEW_STORAGE_KEY) === 'list' ? 'list' : 'grid',
  );

  function changeView(next: ProductView) {
    setView(next);
    localStorage.setItem(VIEW_STORAGE_KEY, next);
  }

  const queryFilters = { ...filters, search: debouncedSearch };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['products', queryFilters],
    queryFn: () => fetchProducts(queryFilters),
    retry: (failureCount, err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status && status >= 400 && status < 500) return false; // don't retry client errors (e.g. bad filter combo)
      return failureCount < 3;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const currentSortValue = `${filters.sortBy}-${filters.sortOrder}`;

  function handleSortChange(value: string) {
    const option = SORT_OPTIONS.find((opt) => opt.value === value);
    if (option) setSort(option.sortBy, option.sortOrder);
  }

  const products = data?.items ?? [];

  const errorMessage =
    (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
    'Something went wrong loading products. Please try again.';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FBF7F0' }}>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1
          className="text-4xl mb-8"
          style={{ color: '#1F2A24', fontFamily: "'Fraunces', serif", fontWeight: 500 }}
        >
          Products
        </h1>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-4 mb-8 items-end">
          <div className="flex flex-col gap-1">
            <label style={labelText}>Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="px-3 py-2 rounded-md text-sm min-w-[220px]"
              style={inputStyle}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label style={labelText}>Category</label>
            <select
              value={filters.categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="px-3 py-2 rounded-md text-sm min-w-[160px]"
              style={inputStyle}
            >
              <option value="">All Categories</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label style={labelText}>Min Price</label>
            <input
              type="number"
              min="0"
              value={filters.minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0"
              className="px-3 py-2 rounded-md text-sm w-24"
              style={inputStyle}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label style={labelText}>Max Price</label>
            <input
              type="number"
              min="0"
              value={filters.maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Any"
              className="px-3 py-2 rounded-md text-sm w-24"
              style={inputStyle}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label style={labelText}>Sort By</label>
            <select
              value={currentSortValue}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-3 py-2 rounded-md text-sm min-w-[160px]"
              style={inputStyle}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 ml-auto">
            <label style={labelText}>View</label>
            <div className="flex rounded-md overflow-hidden" style={{ border: '1px solid #E4DCC9' }}>
              {(['grid', 'list'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => changeView(v)}
                  aria-label={v === 'grid' ? 'Grid view' : 'List view'}
                  aria-pressed={view === v}
                  className="px-3 py-2.5"
                  style={{
                    backgroundColor: view === v ? '#2F6F4F' : '#FFFFFF',
                    color: view === v ? '#FFFFFF' : '#8A8273',
                    transition: 'background-color 0.2s ease, color 0.2s ease',
                  }}
                >
                  {v === 'grid' ? <LayoutGrid size={16} /> : <List size={16} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid / states */}
        {isError ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p style={{ ...inkText, color: '#B14A2D' }}>{errorMessage}</p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-md text-sm"
              style={{ backgroundColor: '#2F6F4F', color: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}
            >
              Reset
            </button>
          </div>
        ) : isLoading ? (
          <div
            className={
              view === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'flex flex-col gap-4'
            }
          >
            {Array.from({ length: view === 'grid' ? 12 : 6 }).map((_, index) => (
              <ProductCardSkeleton key={index} view={view} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p style={{ ...inkText, color: '#8A8273' }}>No products found — try adjusting your filters</p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-md text-sm"
              style={{ backgroundColor: '#2F6F4F', color: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}
            >
              Reset
            </button>
          </div>
        ) : (
          <>
            <div
              key={view}
              className={`view-swap ${
                view === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'flex flex-col gap-4'
              }`}
            >
              {products.map((product) => (
                <ProductCard key={product.id} product={product} view={view} />
              ))}
            </div>
            <Pagination
              currentPage={data?.pageNumber ?? 1}
              totalPages={data?.totalPages ?? 1}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default ProductListingPage;