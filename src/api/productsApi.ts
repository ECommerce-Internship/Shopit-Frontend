import axiosInstance from './axiosInstance';
import type {
  AdminProductQuery,
  Category,
  CreateProductRequest,
  ImportResult,
  PaginatedProducts,
  Product,
  ProductContent,
  ProductFilters,
  UpdateProductRequest,
} from '../types/product';

export type StoreInfo = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  commissionRate: number;
  ownerUserId: number;
  createdAt: string;
};

export async function fetchProducts(filters: ProductFilters): Promise<PaginatedProducts> {
  const params: Record<string, string | number> = {
    PageNumber: filters.page,
  };

  if (filters.search.trim()) params.search = filters.search.trim();
  if (filters.categoryId) params.categoryId = filters.categoryId;
  if (filters.minPrice) params.minPrice = filters.minPrice;
  if (filters.maxPrice) params.maxPrice = filters.maxPrice;
  if (filters.minRating) params.minRating = filters.minRating;
  if (filters.storeId) params.storeId = filters.storeId;
  params.sortBy = filters.sortBy;
  params.sortOrder = filters.sortOrder;

  const response = await axiosInstance.get<PaginatedProducts>('/api/v1/products', { params });
  return response.data;
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await axiosInstance.get<Category[]>('/api/v1/categories');
  return response.data;
}

export async function fetchProductById(id: string): Promise<Product> {
  const response = await axiosInstance.get<Product>(`/api/v1/products/${id}`);
  return response.data;
}

// ── Admin CRUD ──────────────────────────────────────────────────────────────
// These map 1:1 to the endpoints on Shopit.API ProductsController. Sends the
// backend's PascalCase query-param names (ProductQueryParameters) so paging,
// search and sorting actually bind server-side.

export async function fetchAdminProducts(query: AdminProductQuery): Promise<PaginatedProducts> {
  const params: Record<string, string | number> = {
    PageNumber: query.page,
    PageSize: query.pageSize ?? 10,
    SortBy: query.sortBy,
    sortOrder: query.sortOrder,
  };

  if (query.search?.trim()) params.Search = query.search.trim();
  if (query.categoryId) params.CategoryId = query.categoryId;

  const response = await axiosInstance.get<PaginatedProducts>('/api/v1/products', { params });
  return response.data;
}

export async function createProduct(body: CreateProductRequest): Promise<Product> {
  const response = await axiosInstance.post<Product>('/api/v1/products', body);
  return response.data;
}

export async function updateProduct(id: number, body: UpdateProductRequest): Promise<Product> {
  const response = await axiosInstance.put<Product>(`/api/v1/products/${id}`, body);
  return response.data;
}

export async function deleteProduct(id: number): Promise<void> {
  await axiosInstance.delete(`/api/v1/products/${id}`);
}

// Uploads a jpg/png (≤5MB). Field name must be "file" to match IFormFile binding.
// Content-Type is left to the browser so the multipart boundary is set correctly.
export async function uploadProductImage(id: number, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post<{ imageUrl: string }>(
    `/api/v1/products/${id}/image`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data.imageUrl;
}

export async function deleteProductImage(id: number): Promise<void> {
  await axiosInstance.delete(`/api/v1/products/${id}/image`);
}

// Bulk import from an .xlsx file (≤10MB). Returns per-row success/failure counts.
export async function importProducts(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post<ImportResult>('/api/v1/products/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

// Triggers a product import from the Excel file on the configured SFTP server.
// Takes no upload — the server downloads the file itself and runs it through the
// same pipeline as importProducts, returning the same per-row result shape.
export async function importProductsFromSftp(): Promise<ImportResult> {
  const response = await axiosInstance.post<ImportResult>('/api/v1/products/import-from-sftp');
  return response.data;
}

// AI content suggestion — does NOT persist; caller applies chosen fields via PUT.
// Rate limited server-side (429).
export async function generateProductContent(id: number): Promise<ProductContent> {
  const response = await axiosInstance.post<ProductContent>(`/api/v1/products/${id}/generate-content`);
  return response.data;
}

export async function fetchStorefront(slug: string): Promise<StoreInfo> {
  const response = await axiosInstance.get<StoreInfo>(`/api/v1/stores/${slug}`);
  return response.data;
}

export async function fetchStorefrontProducts(slug: string, page: number = 1, pageSize: number = 20): Promise<PaginatedProducts> {
  const response = await axiosInstance.get<PaginatedProducts>(`/api/v1/stores/${slug}/products`, {
    params: { pageNumber: page, pageSize },
  });
  return response.data;
}
export async function fetchSemanticProducts(query: string, take: number = 10): Promise<Product[]> {
  const response = await axiosInstance.get<Product[]>('/api/v1/products/search/semantic', {
    params: { q: query, take },
  });
  return response.data;
}