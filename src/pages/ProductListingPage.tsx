import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories, fetchProducts, fetchSemanticProducts } from '../api/productsApi';
import { useProductFilters } from '../hooks/useProductFilters';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';
import { Pagination } from '../components/Pagination';
import type { Product, SortBy, SortOrder } from '../types/product';
import { Sparkles } from 'lucide-react';

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
  const { filters, setCategoryId, setMinPrice, setMaxPrice, setSort, setPage, resetFilters } =
    useProductFilters();

  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(searchValue), 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchValue]);

  const isSearching = debouncedSearch.trim().length > 2;
  const queryFilters = { ...filters, search: '' };

  // Semantic search when user types
  const semanticQuery = useQuery({
    queryKey: ['semantic-search', debouncedSearch],
    queryFn: () => fetchSemanticProducts(debouncedSearch, 20),
    enabled: isSearching,
  });

  // All products when no search query
  const allProductsQuery = useQuery({
    queryKey: ['products', queryFilters],
    queryFn: () => fetchProducts(queryFilters),
    enabled: !isSearching,
    retry: (failureCount, err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status && status >= 400 && status < 500) return false;
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

  const isLoading = isSearching ? semanticQuery.isLoading : allProductsQuery.isLoading;
  const isError = isSearching ? semanticQuery.isError : allProductsQuery.isError;

  const products: Product[] = isSearching
    ? (semanticQuery.data ?? [])
    : (allProductsQuery.data?.items ?? []);

  const showPagination = !isSearching && allProductsQuery.data;

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
          {/* Unified search box */}
          <div className="flex flex-col gap-1">
            <label style={labelText}>Search</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search products..."
                className="px-3 py-2 rounded-md text-sm min-w-[280px]"
                style={{ ...inputStyle, paddingRight: '32px' }}
              />
              {isSearching && (
                <div style={{ position: 'absolute', right: '10px', display: 'flex', alignItems: 'center' }}>
                  <Sparkles size={14} color="#7B5EA7" />
                </div>
              )}
            </div>
            {isSearching && (
              <span style={{ fontSize: '11px', color: '#7B5EA7', fontFamily: "'IBM Plex Mono', monospace" }}>
                ✨ AI-powered results
              </span>
            )}
          </div>

          {/* Category filter — hidden in semantic mode since results are ranked by relevance */}
          {!isSearching && (
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
          )}

          {!isSearching && (
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
          )}

          {!isSearching && (
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
          )}

          {!isSearching && (
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
          )}
        </div>

        {/* Grid / states */}
        {isError ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p style={{ ...inkText, color: '#B14A2D' }}>Something went wrong. Please try again.</p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-md text-sm"
              style={{ backgroundColor: '#2F6F4F', color: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}
            >
              Reset
            </button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p style={{ ...inkText, color: '#8A8273' }}>
              {isSearching
                ? 'No matching products found — try a different description'
                : 'No products found — try adjusting your filters'}
            </p>
            {!isSearching && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 rounded-md text-sm"
                style={{ backgroundColor: '#2F6F4F', color: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}
              >
                Reset
              </button>
            )}
          </div>
        ) : (
          <>
            {isSearching && (
              <p style={{ ...labelText, marginBottom: '16px' }}>
                {products.length} results · ranked by AI relevance
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {showPagination && (
              <Pagination
                currentPage={allProductsQuery.data?.pageNumber ?? 1}
                totalPages={allProductsQuery.data?.totalPages ?? 1}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ProductListingPage;