import axiosInstance from './axiosInstance';
import type { Store, AdminStore, StoreStatus } from '../types/store';

// Lists approved stores for the admin's product-create flow (a new product must be
// filed under an approved store). Admin-only endpoint; returns a plain array.
export async function fetchStores(): Promise<Store[]> {
  const response = await axiosInstance.get<Store[]>('/api/v1/admin/stores/approved');
  return response.data;
}

// Stores awaiting approval, with owner name, for the admin moderation queue.
export async function fetchPendingStores(): Promise<AdminStore[]> {
  const response = await axiosInstance.get<AdminStore[]>('/api/v1/admin/stores/pending');
  return response.data;
}

// All stores for the admin management table, optionally narrowed to one status.
export async function fetchAllStores(status?: StoreStatus): Promise<AdminStore[]> {
  const response = await axiosInstance.get<AdminStore[]>('/api/v1/admin/stores', {
    params: status ? { status } : undefined,
  });
  return response.data;
}

// Moderation transitions. `approve` covers both first-time approval (Pending) and
// re-approval of a suspended store (Suspended -> Approved) server-side.
export async function approveStore(id: number): Promise<void> {
  await axiosInstance.put(`/api/v1/admin/stores/${id}/approve`);
}

export async function rejectStore(id: number): Promise<void> {
  await axiosInstance.put(`/api/v1/admin/stores/${id}/reject`);
}

export async function suspendStore(id: number): Promise<void> {
  await axiosInstance.put(`/api/v1/admin/stores/${id}/suspend`);
}
