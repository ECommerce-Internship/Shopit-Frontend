import axiosInstance from './axiosInstance';

export type PaymentStatus = 0 | 1 | 2 | 3; // 0=Pending, 1=Paid, 2=Refunded

export type Payment = {
  id: number;
  orderId: number;
  amount: number;
  status: PaymentStatus;
  method: number;
  transactionRef: string | null;
  paidAt: string | null;
};

export type PaginatedPayments = {
  items: Payment[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getPaymentByOrderId(orderId: number): Promise<Payment> {
  const response = await axiosInstance.get<Payment>(`/api/v1/payments/order/${orderId}`);
  return response.data;
}

export async function refundPayment(paymentId: number): Promise<Payment> {
  const response = await axiosInstance.post<Payment>(`/api/v1/payments/${paymentId}/refund`);
  return response.data;
}

export async function getAllPayments(status?: number): Promise<PaginatedPayments> {
  const response = await axiosInstance.get<Payment[]>('/api/v1/payments');
  const filtered = status !== undefined ? response.data.filter((p: Payment) => p.status === status) : response.data;
  return {
    items: filtered,
    totalCount: filtered.length,
    page: 1,
    pageSize: filtered.length,
    totalPages: 1,
  };
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case 0: return 'Pending';
    case 1: return 'Paid';
    case 2: return 'Failed';
    case 3: return 'Refunded';
    default: return 'Unknown';
  }
}

export function getPaymentMethodLabel(method: number): string {
  switch (method) {
    case 0: return 'Credit Card';
    case 1: return 'Cash on Delivery';
    case 2: return 'PayPal';
    case 3: return 'Bank Transfer';
    default: return 'Unknown';
  }
}

export function getPaymentStatusStyle(status: PaymentStatus): { bg: string; text: string } {
  switch (status) {
    case 0: return { bg: '#F6EAD2', text: '#A87420' };
    case 1: return { bg: '#E3EEE6', text: '#2F6F4F' };
    case 2: return { bg: '#F0ECE2', text: '#8A8273' };
    case 3: return { bg: '#F0ECE2', text: '#8A8273' };
    default: return { bg: '#F0ECE2', text: '#8A8273' };
  }
}