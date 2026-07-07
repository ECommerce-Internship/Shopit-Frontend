import axiosInstance from './axiosInstance';

// Fulfillment statuses mirror the backend OrderStatus enum (string-valued over
// the wire). Note "Processing" — the backend has no "Confirmed" state.
export type OrderStatus =
  | 'Pending'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export const ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

// Allowed forward transitions, kept in sync with the server-side progression map
// in OrderService.UpdateStoreOrderStatusAsync. Used to build the inline dropdown
// so we only ever offer moves the backend will accept.
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  Pending: ['Processing', 'Cancelled'],
  Processing: ['Shipped'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

// One store's portion of a buyer's order. StoreOrderId is what the status-update
// endpoint keys on (added to the backend DTO for this feature).
export type StoreOrderSummary = {
  storeOrderId: number;
  storeId: number;
  storeName: string;
  status: OrderStatus;
  subTotal: number;
  itemCount: number;
};

export type AdminOrder = {
  id: number;
  status: OrderStatus;
  totalAmount: number;
  discountAmount: number;
  shippingAddress: string;
  createdAt: string;
  itemCount: number;
  customerEmail: string | null;
  paymentStatus: string | null;
  storeOrders: StoreOrderSummary[];
};

export type PaginatedOrders = {
  items: AdminOrder[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type AdminOrderQuery = {
  page: number;
  pageSize?: number;
  status?: string;
};

export async function fetchAdminOrders(query: AdminOrderQuery): Promise<PaginatedOrders> {
  const params: Record<string, string | number> = {
    page: query.page,
    pageSize: query.pageSize ?? 10,
  };
  if (query.status) params.status = query.status;

  const response = await axiosInstance.get<PaginatedOrders>('/api/v1/admin/orders', { params });
  return response.data;
}

// Advances a single store-order through the fulfillment flow. The buyer order's
// overall status is rolled up server-side from its store-orders.
export async function updateStoreOrderStatus(storeOrderId: number, status: OrderStatus): Promise<void> {
  await axiosInstance.put(`/api/v1/store-orders/${storeOrderId}/status`, { status });
}

export function getOrderStatusStyle(status: string): { bg: string; text: string } {
  switch (status) {
    case 'Pending': return { bg: '#F6EAD2', text: '#A87420' };
    case 'Processing': return { bg: '#E6EDF5', text: '#3A5A8A' };
    case 'Shipped': return { bg: '#EAE6F5', text: '#5A3A8A' };
    case 'Delivered': return { bg: '#E3EEE6', text: '#2F6F4F' };
    case 'Cancelled': return { bg: '#FBEEE8', text: '#B14A2D' };
    default: return { bg: '#F0ECE2', text: '#8A8273' };
  }
}
