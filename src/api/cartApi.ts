import axiosInstance from './axiosInstance';
import type { Cart } from '../types/cart';

export async function addCartItem(productId: number, quantity: number): Promise<Cart> {
  const response = await axiosInstance.post<Cart>('/api/v1/cart/items', { productId, quantity });
  return response.data;
}