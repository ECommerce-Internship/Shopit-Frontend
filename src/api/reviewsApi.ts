import axiosInstance from './axiosInstance';
import type { ProductReviews } from '../types/review';

export async function fetchProductReviews(productId: string): Promise<ProductReviews> {
  const response = await axiosInstance.get<ProductReviews>(`/api/v1/reviews/product/${productId}`);
  return response.data;
}