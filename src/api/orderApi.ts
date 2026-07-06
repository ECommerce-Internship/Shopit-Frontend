import axiosInstance from './axiosInstance';

export type OrderItem = {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type StoreOrder = {
  storeId: number;
  storeName: string;
  status: string;
  subTotal: number;
  items: OrderItem[];
};

export type StoreOrderSummary = {
  storeId: number;
  storeName: string;
  status: string;
  subTotal: number;
  itemCount: number;
};

export type OrderSummary = {
  id: number;
  status: string;
  totalAmount: number;
  discountAmount: number;
  shippingAddress: string;
  createdAt: string;
  itemCount: number;
  paymentStatus: string | null;
  storeOrders: StoreOrderSummary[];
};

export type Order = {
  id: number;
  status: string;
  totalAmount: number;
  discountAmount: number;
  shippingAddress: string;
  createdAt: string;
  items: OrderItem[];
  storeOrders: StoreOrder[];
};

export type PaymentResponse = {
  id: number;
  orderId: number;
  amount: number;
  status: number;
  method: number;
  transactionRef: string | null;
  paidAt: string | null;
};

export type PaginatedOrders = {
  items: OrderSummary[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
};

export async function placeOrder(shippingAddress: string): Promise<Order> {
  const response = await axiosInstance.post<Order>('/api/v1/orders', { shippingAddress });
  return response.data;
}

export async function processPayment(orderId: number, paymentMethod: number): Promise<PaymentResponse> {
  const response = await axiosInstance.post<PaymentResponse>('/api/v1/payments', {
    orderId,
    paymentMethod,
    simulateFailure: false,
  });
  return response.data;
}

export async function getMyOrders(page: number = 1, pageSize: number = 10): Promise<PaginatedOrders> {
  const response = await axiosInstance.get<PaginatedOrders>('/api/v1/orders', {
    params: { page, pageSize },
  });
  return response.data;
}

export async function getOrderById(id: number): Promise<Order> {
  const response = await axiosInstance.get<Order>(`/api/v1/orders/${id}`);
  return response.data;
}

export async function cancelOrder(id: number): Promise<Order> {
  const response = await axiosInstance.put<Order>(`/api/v1/orders/${id}/cancel`);
  return response.data;
}