import axiosInstance from './axiosInstance';
import type { ImageSearchResult } from '../types/imageSearch';

// Visual product search: upload a photo, get the visually most similar products.
// Field name must be "image" to match the controller's IFormFile binding, and the
// Content-Type is left to the browser so the multipart boundary is set correctly.
export async function searchByImage(file: File, topK = 12): Promise<ImageSearchResult> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await axiosInstance.post<ImageSearchResult>(
    `/api/v1/image-search/search?topK=${topK}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return response.data;
}
