import axiosInstance from './axiosInstance';

export type DashboardSummary = {
  totalRevenue: number;
  totalCommission: number;
  totalOrders: number;
  totalCustomers: number;
  lowStockCount: number;
  todaysNewOrders: number;
};

export type SellerDashboardSummary = {
  grossSales: number;
  totalCommission: number;
  netEarnings: number;
  totalOrders: number;
  lowStockCount: number;
  todaysNewOrders: number;
};

export type RevenueByPeriod = {
  period: string;
  revenue: number;
  orderCount: number;
};

export type TopProduct = {
  productId: number;
  productName: string;
  unitsSold: number;
  revenue: number;
};

export type OrdersByStatus = {
  status: string;
  count: number;
};

// Admin endpoints
export async function getAdminSummary(): Promise<DashboardSummary> {
  const response = await axiosInstance.get<DashboardSummary>('/api/v1/admin/dashboard/summary');
  return response.data;
}

export async function getAdminRevenue(period: string = 'day'): Promise<RevenueByPeriod[]> {
  const response = await axiosInstance.get<RevenueByPeriod[]>('/api/v1/admin/dashboard/revenue', { params: { period } });
  return response.data;
}

export async function getAdminTopProducts(): Promise<TopProduct[]> {
  const response = await axiosInstance.get<TopProduct[]>('/api/v1/admin/dashboard/top-products');
  return response.data;
}

export async function getAdminOrdersByStatus(): Promise<OrdersByStatus[]> {
  const response = await axiosInstance.get<OrdersByStatus[]>('/api/v1/admin/dashboard/orders-by-status');
  return response.data;
}

// Seller endpoints
export async function getSellerSummary(): Promise<SellerDashboardSummary> {
  const response = await axiosInstance.get<SellerDashboardSummary>('/api/v1/seller/dashboard/summary');
  return response.data;
}

export async function getSellerRevenue(period: string = 'day'): Promise<RevenueByPeriod[]> {
  const response = await axiosInstance.get<RevenueByPeriod[]>('/api/v1/seller/dashboard/revenue', { params: { period } });
  return response.data;
}

export async function getSellerTopProducts(): Promise<TopProduct[]> {
  const response = await axiosInstance.get<TopProduct[]>('/api/v1/seller/dashboard/top-products');
  return response.data;
}