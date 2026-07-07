import axiosInstance from './axiosInstance';
import type { SellerStoreOrder, OrderStatus } from '../types/sellerOrder';

// A seller's store orders — their portion of each buyer order — across all
// stores they own. Never includes another seller's portion of a shared order.
export async function fetchMyStoreOrders(): Promise<SellerStoreOrder[]> {
  const response = await axiosInstance.get<SellerStoreOrder[]>('/api/v1/store-orders/mine');
  return response.data;
}

export async function fetchStoreOrderById(storeOrderId: number): Promise<SellerStoreOrder> {
  const response = await axiosInstance.get<SellerStoreOrder>(`/api/v1/store-orders/${storeOrderId}`);
  return response.data;
}

// The backend re-validates the transition (Pending→Processing/Cancelled,
// Processing→Shipped, Shipped→Delivered) and returns 400 on an invalid one,
// and restocks only this store order's items when cancelling.
export async function updateStoreOrderStatus(storeOrderId: number, status: OrderStatus): Promise<SellerStoreOrder> {
  const response = await axiosInstance.put<SellerStoreOrder>(
    `/api/v1/store-orders/${storeOrderId}/status`,
    { status }
  );
  return response.data;
}
