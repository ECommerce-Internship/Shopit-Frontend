export type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  sku: string;
  imageUrl: string | null;
  categoryId: number;
  categoryName: string;
  stockQuantity: number;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  // Not yet returned by backend (SCRUM-133 pending) — optional until it lands.
  storeId?: number;
  storeName?: string;
  storeSlug?: string;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  parentCategoryId: number | null;
  subcategoryCount: number;
  subcategories: Category[];
};

export type SortBy = 'name' | 'price' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export type ProductFilters = {
  search: string;
  categoryId: string;
  minPrice: string;
  maxPrice: string;
  sortBy: SortBy;
  sortOrder: SortOrder;
  page: number;
  storeId: string;
};

export type PaginatedProducts = {
  items: Product[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};