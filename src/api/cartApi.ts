import axiosInstance from './axiosInstance';
import type { Cart } from '../types/cart';

export async function fetchCart(): Promise<Cart> {
  const response = await axiosInstance.get<Cart>('/api/v1/cart');
  return response.data;
}

export async function addCartItem(productId: number, quantity: number): Promise<Cart> {
  const response = await axiosInstance.post<Cart>('/api/v1/cart/items', { productId, quantity });
  return response.data;
}

export async function updateCartItem(cartItemId: number, quantity: number): Promise<Cart> {
  const response = await axiosInstance.put<Cart>(`/api/v1/cart/items/${cartItemId}`, { quantity });
  return response.data;
}

export async function removeCartItem(cartItemId: number): Promise<void> {
  await axiosInstance.delete(`/api/v1/cart/items/${cartItemId}`);
}

export async function applyCoupon(code: string): Promise<Cart> {
  const response = await axiosInstance.post<Cart>('/api/v1/cart/coupon', { code });
  return response.data;
}

export async function removeCoupon(): Promise<Cart> {
  const response = await axiosInstance.delete<Cart>('/api/v1/cart/coupon');
  return response.data;
}