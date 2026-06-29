import axiosInstance from './axiosInstance';

export type OrderItem = {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type Order = {
  id: number;
  status: string;
  totalAmount: number;
  discountAmount: number;
  shippingAddress: string;
  createdAt: string;
  items: OrderItem[];
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

export async function getOrderById(id: number): Promise<Order> {
  const response = await axiosInstance.get<Order>(`/api/v1/orders/${id}`);
  return response.data;
}