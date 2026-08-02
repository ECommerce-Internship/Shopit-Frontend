import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, List, Sparkles } from 'lucide-react';
import { fetchCategories, fetchProducts, fetchSemanticProducts } from '../api/productsApi';
import { useProductFilters } from '../hooks/useProductFilters';
import { staggerContainer } from '../lib/motion';
import { ProductCard, type ProductView } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';
import { Pagination } from '../components/Pagination';
import { PlaceholdersAndVanishInput } from '../components/ui/placeholders-and-vanish-input';
import type { Product, SortBy, SortOrder } from '../types/product';

const VIEW_STORAGE_KEY = 'shopit-products-view';

const SEARCH_PLACEHOLDERS = [
  'Search for wireless headphones...',
  'A cozy knit sweater for winter',
  'Minimalist leather wallet',
  'Something to brew great coffee',
  'A gift under $50',
];

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
// Matches the search bar: white pill, sand border, the same soft shadow.
const inputStyle = {
  ...inkText,
  border: '1px solid #E4DCC9',
  backgroundColor: '#FFFFFF',
  boxShadow: '0px 2px 8px -2px rgba(31,42,36,0.08)',
};

const RATING_OPTIONS = [
  { value: '', label: 'Any rating' },
  { value: '4', label: '4★ & up' },
  { value: '3', label: '3★ & up' },
  { value: '2', label: '2★ & up' },
  { value: '1', label: '1★ & up' },
];

// Fade-and-rise used by the search bar's placeholder, reused for each control under
// the search bar so they animate in/out the same way. Staggered by index so the row
// arrives one control at a time rather than all at once.
function filterMotion(index: number, prefersReduced: boolean | null) {
  return {
    initial: prefersReduced ? false : { y: 8, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: prefersReduced ? undefined : { y: -12, opacity: 0 },
    transition: { duration: 0.3, ease: 'linear' as const, delay: index * 0.06 },
  };
}

function ProductListingPage() {
  const navigate = useNavigate();
  const { filters, setCategoryId, setMinPrice, setMaxPrice, setMinRating, setSort, setPage, resetFilters } =
    useProductFilters();

  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [view, setView] = useState<ProductView>(() =>
    localStorage.getItem(VIEW_STORAGE_KEY) === 'list' ? 'list' : 'grid',
  );

  function changeView(next: ProductView) {
    setView(next);
    localStorage.setItem(VIEW_STORAGE_KEY, next);
  }

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

  const prefersReduced = useReducedMotion();

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

        {/* Search — on its own line */}
        <div className="mb-3">
          <PlaceholdersAndVanishInput
            placeholders={SEARCH_PLACEHOLDERS}
            onChange={(e) => setSearchValue(e.target.value)}
            onSubmit={(e) => e.preventDefault()}
            onImageSearch={() => navigate('/visual-search')}
          />
          {isSearching && (
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <Sparkles size={14} color="#7B5EA7" />
              <span style={{ fontSize: '11px', color: '#7B5EA7', fontFamily: "'IBM Plex Mono', monospace" }}>
                ✨ AI-powered results
              </span>
            </div>
          )}
        </div>

        {/* Filters — under the search bar. Each control fades-and-rises in with a
            stagger, matching the search bar's placeholder motion. */}
        <div className="flex flex-wrap gap-4 mb-8 items-end">
          {/* Category / price / sort — hidden in semantic mode since results are ranked
              by relevance. */}
          <AnimatePresence>
            {!isSearching && [
              <motion.div key="category" className="flex flex-col gap-1" {...filterMotion(0, prefersReduced)}>
                <label style={labelText}>Category</label>
                <select
                  value={filters.categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="px-4 py-2.5 rounded-full text-sm min-w-[160px]"
                  style={inputStyle}
                >
                  <option value="">All Categories</option>
                  {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </motion.div>,

              <motion.div key="min-price" className="flex flex-col gap-1" {...filterMotion(1, prefersReduced)}>
                <label style={labelText}>Min Price</label>
                <input
                  type="number"
                  min="0"
                  value={filters.minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0"
                  className="px-4 py-2.5 rounded-full text-sm w-28"
                  style={inputStyle}
                />
              </motion.div>,

              <motion.div key="max-price" className="flex flex-col gap-1" {...filterMotion(2, prefersReduced)}>
                <label style={labelText}>Max Price</label>
                <input
                  type="number"
                  min="0"
                  value={filters.maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Any"
                  className="px-4 py-2.5 rounded-full text-sm w-28"
                  style={inputStyle}
                />
              </motion.div>,

              <motion.div key="rating" className="flex flex-col gap-1" {...filterMotion(3, prefersReduced)}>
                <label style={labelText}>Rating</label>
                <select
                  value={filters.minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="px-4 py-2.5 rounded-full text-sm min-w-[140px]"
                  style={inputStyle}
                >
                  {RATING_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </motion.div>,

              <motion.div key="sort" className="flex flex-col gap-1" {...filterMotion(4, prefersReduced)}>
                <label style={labelText}>Sort By</label>
                <select
                  value={currentSortValue}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-4 py-2.5 rounded-full text-sm min-w-[160px]"
                  style={inputStyle}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </motion.div>,
            ]}
          </AnimatePresence>

          <motion.div className="flex flex-col gap-1 ml-auto" {...filterMotion(5, prefersReduced)}>
            <label style={labelText}>View</label>
            <div
              className="flex rounded-full overflow-hidden"
              style={{ border: '1px solid #E4DCC9', boxShadow: '0px 2px 8px -2px rgba(31,42,36,0.08)' }}
            >
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
          </motion.div>
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
            <motion.div
              key={view}
              className={
                view === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'flex flex-col gap-4'
              }
              variants={staggerContainer}
              initial={prefersReduced ? false : 'hidden'}
              animate="show"
            >
              {products.map((product) => (
                <ProductCard key={product.id} product={product} view={view} />
              ))}
            </motion.div>
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