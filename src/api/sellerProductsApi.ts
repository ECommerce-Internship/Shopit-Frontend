import axiosInstance from './axiosInstance';
import type { PaginatedProducts, SortBy, SortOrder } from '../types/product';

// GET /products/mine is NOT restricted to Approved stores (unlike the public
// GET /products or the admin-oriented GET /products used elsewhere in
// productsApi.ts), so a seller can see and manage products even while their
// store is Pending/Suspended awaiting moderation. Product CRUD, image upload,
// and inventory update/threshold calls are the same endpoints used elsewhere
// in the app (see productsApi.ts and inventoryApi.ts) — the backend enforces
// ownership (SCRUM-134/136) regardless of which screen calls them.

export type MyProductsQuery = {
  page: number;
  pageSize?: number;
  search?: string;
  categoryId?: number | null;
  storeId?: number | null;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
};

export async function fetchMyProducts(query: MyProductsQuery): Promise<PaginatedProducts> {
  const params: Record<string, string | number> = {
    PageNumber: query.page,
    PageSize: query.pageSize ?? 10,
    SortBy: query.sortBy ?? 'createdAt',
    sortOrder: query.sortOrder ?? 'desc',
  };

  if (query.search?.trim()) params.Search = query.search.trim();
  if (query.categoryId) params.CategoryId = query.categoryId;
  if (query.storeId) params.StoreId = query.storeId;

  const response = await axiosInstance.get<PaginatedProducts>('/api/v1/products/mine', { params });
  return response.data;
}
