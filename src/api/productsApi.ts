import axiosInstance from './axiosInstance';
import type { Category, PaginatedProducts, Product, ProductFilters } from '../types/product';

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
    page: filters.page,
  };

  if (filters.search.trim()) params.search = filters.search.trim();
  if (filters.categoryId) params.categoryId = filters.categoryId;
  if (filters.minPrice) params.minPrice = filters.minPrice;
  if (filters.maxPrice) params.maxPrice = filters.maxPrice;
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