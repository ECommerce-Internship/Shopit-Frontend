import axiosInstance from './axiosInstance';
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../types/product';

// ── Admin Categories CRUD ─────────────────────────────────────────────────────
// Maps 1:1 to the admin-only write endpoints on the Categories controller.
// Reads (GET /api/v1/categories) still live in productsApi.fetchCategories, which
// the product dropdowns already consume under React Query key ['categories'].

export async function createCategory(body: CreateCategoryRequest): Promise<Category> {
  const response = await axiosInstance.post<Category>('/api/v1/categories', body);
  return response.data;
}

export async function updateCategory(id: number, body: UpdateCategoryRequest): Promise<Category> {
  const response = await axiosInstance.put<Category>(`/api/v1/categories/${id}`, body);
  return response.data;
}

// Backend returns 409 when the category has linked products — callers surface that
// as a clear "can't delete" message.
export async function deleteCategory(id: number): Promise<void> {
  await axiosInstance.delete(`/api/v1/categories/${id}`);
}
