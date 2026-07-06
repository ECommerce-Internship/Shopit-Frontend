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
  storeId: number;
  storeName: string;
  storeSlug: string;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  parentCategoryId: number | null;
  subcategoryCount: number;
  subcategories: Category[];
};

export type CreateCategoryRequest = {
  name: string;
  parentCategoryId: number | null;
};

export type UpdateCategoryRequest = {
  name: string;
  parentCategoryId: number | null;
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

// Backend only sorts by these fields (ProductService throws on anything else).
export type AdminSortBy = 'name' | 'price';

export type AdminProductQuery = {
  page: number;
  pageSize?: number;
  search?: string;
  categoryId?: number | null;
  sortBy: AdminSortBy;
  sortOrder: SortOrder;
};

export type CreateProductRequest = {
  name: string;
  description: string | null;
  price: number;
  sku: string;
  imageUrl?: string | null;
  categoryId: number;
  storeId: number;
  initialStock: number;
};

export type UpdateProductRequest = {
  name: string;
  description: string | null;
  price: number;
  sku: string;
  imageUrl?: string | null;
  categoryId: number;
  stockQuantity: number;
};

export type ImportError = {
  row: number;
  reason: string;
};

export type ImportResult = {
  addedCount: number;
  failedCount: number;
  errors: ImportError[];
};

export type ProductContent = {
  description: string;
  features: string[];
  seoTitle: string;
  metaDescription: string;
};