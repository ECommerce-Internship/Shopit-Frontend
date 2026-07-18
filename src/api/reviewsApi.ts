import axiosInstance from './axiosInstance';
import type { ProductReviews, Review } from '../types/review';

export async function fetchProductReviews(productId: string, page: number = 1, pageSize: number = 5): Promise<ProductReviews> {
  const response = await axiosInstance.get<ProductReviews>(`/api/v1/reviews/product/${productId}`, {
    params: { PageNumber: page, PageSize: pageSize },
  });
  return response.data;
}

export async function submitReview(productId: number, rating: number, comment: string): Promise<Review> {
  const response = await axiosInstance.post<Review>('/api/v1/reviews', { productId, rating, comment });
  return response.data;
}

export async function deleteReview(reviewId: number): Promise<void> {
  await axiosInstance.delete(`/api/v1/reviews/${reviewId}`);
}

export async function adminDeleteReview(reviewId: number): Promise<void> {
  await axiosInstance.delete(`/api/v1/reviews/${reviewId}/admin`);
}

export async function getAllReviews(page: number = 1, pageSize: number = 10): Promise<ProductReviews> {
  const response = await axiosInstance.get<ProductReviews>('/api/v1/reviews', {
    params: { PageNumber: page, PageSize: pageSize },
  });
  return response.data;
}

export async function fetchModerationQueue(page: number = 1, pageSize: number = 10): Promise<ProductReviews> {
  const response = await axiosInstance.get<ProductReviews>('/api/v1/reviews/moderation-queue', {
    params: { PageNumber: page, PageSize: pageSize },
  });
  return response.data;
}

export async function approveReview(reviewId: number): Promise<Review> {
  const response = await axiosInstance.post<Review>(`/api/v1/reviews/${reviewId}/approve`);
  return response.data;
}

export async function rejectReview(reviewId: number, reason: string): Promise<Review> {
  const response = await axiosInstance.post<Review>(`/api/v1/reviews/${reviewId}/reject`, { reason });
  return response.data;
}

export async function fetchMyFlaggedReviews(page: number = 1, pageSize: number = 10): Promise<ProductReviews> {
  const response = await axiosInstance.get<ProductReviews>(`/api/v1/reviews/mine/flagged`, {
    params: { PageNumber: page, PageSize: pageSize },
  });
  return response.data;
}
