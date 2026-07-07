import axiosInstance from './axiosInstance';

// Maps to InventoryResponse on the backend. `isLowStock` is computed server-side
// (quantity <= lowStockThreshold) — we trust it rather than recomputing.
export type InventoryItem = {
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  storeId: number;
  storeName: string;
  lastUpdated: string;
};

// GET /api/v1/inventory returns a flat array (admin-only, not paginated).
export async function fetchInventory(): Promise<InventoryItem[]> {
  const response = await axiosInstance.get<InventoryItem[]>('/api/v1/inventory');
  return response.data;
}

// Per-product inventory lookup — usable by a seller for their own product
// (fetchInventory above is admin-only). Used to load the current
// low-stock threshold before editing it.
export async function fetchInventoryForProduct(productId: number): Promise<InventoryItem> {
  const response = await axiosInstance.get<InventoryItem>(`/api/v1/inventory/${productId}`);
  return response.data;
}

export async function updateStock(productId: number, quantity: number): Promise<InventoryItem> {
  const response = await axiosInstance.put<InventoryItem>(
    `/api/v1/inventory/${productId}/stock`,
    { quantity }
  );
  return response.data;
}

// Threshold is per-product on this backend (there is no single global threshold).
export async function updateThreshold(productId: number, threshold: number): Promise<InventoryItem> {
  const response = await axiosInstance.put<InventoryItem>(
    `/api/v1/inventory/${productId}/threshold`,
    { threshold }
  );
  return response.data;
}
