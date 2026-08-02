import axiosInstance from './axiosInstance';

export type DashboardSummary = {
  totalRevenue: number;
  totalCommission: number;
  totalOrders: number;
  totalCustomers: number;
  lowStockCount: number;
  todaysNewOrders: number;
};

export type RevenuePoint = {
  period: string;
  revenue: number;
  orderCount: number;
};

export type OrdersByStatus = {
  status: string;
  count: number;
};

export type TopProduct = {
  productId: number;
  productName: string;
  unitsSold: number;
  revenue: number;
};
export type SellerDashboardSummary = {
  grossSales: number;
  totalCommission: number;
  netEarnings: number;
  totalOrders: number;
  lowStockCount: number;
  todaysNewOrders: number;
};

export async function fetchSellerSummary(): Promise<SellerDashboardSummary> {
  const response = await axiosInstance.get<SellerDashboardSummary>('/api/v1/seller/dashboard/summary');
  return response.data;
}

export async function fetchSellerRevenue(period: 'day' | 'week' | 'monthly' = 'day'): Promise<RevenuePoint[]> {
  const response = await axiosInstance.get<RevenuePoint[]>('/api/v1/seller/dashboard/revenue', {
    params: { period },
  });
  return response.data;
}

export async function fetchSellerTopProducts(): Promise<TopProduct[]> {
  const response = await axiosInstance.get<TopProduct[]>('/api/v1/seller/dashboard/top-products');
  return response.data;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const response = await axiosInstance.get<DashboardSummary>('/api/v1/admin/dashboard/summary');
  return response.data;
}

export async function fetchRevenue(period: 'day' | 'week' | 'monthly' = 'monthly'): Promise<RevenuePoint[]> {
  const response = await axiosInstance.get<RevenuePoint[]>('/api/v1/admin/dashboard/revenue', {
    params: { period },
  });
  return response.data;
}

export async function fetchOrdersByStatus(): Promise<OrdersByStatus[]> {
  const response = await axiosInstance.get<OrdersByStatus[]>('/api/v1/admin/dashboard/orders-by-status');
  return response.data;
}

export async function fetchTopProducts(): Promise<TopProduct[]> {
  const response = await axiosInstance.get<TopProduct[]>('/api/v1/admin/dashboard/top-products');
  return response.data;
}
