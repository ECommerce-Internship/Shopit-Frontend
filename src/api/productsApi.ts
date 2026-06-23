import axiosInstance from './axiosInstance';
import type { Category, PaginatedProducts, ProductFilters } from '../types/product';

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