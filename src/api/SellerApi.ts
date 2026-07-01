import axiosInstance from './axiosInstance';

export type StoreResponse = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  commissionRate: number;
  ownerUserId: number;
  createdAt: string;
};

export type RegisterSellerRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  storeName: string;
  storeDescription?: string;
};

export type RegisterSellerResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role?: string;
  };
};

export async function registerSeller(data: RegisterSellerRequest): Promise<RegisterSellerResponse> {
  const response = await axiosInstance.post<RegisterSellerResponse>('/api/v1/auth/register-seller', data);
  return response.data;
}

export async function getMyStores(): Promise<StoreResponse[]> {
  const response = await axiosInstance.get<StoreResponse[]>('/api/v1/stores');
  return response.data;
}

export async function createStore(name: string, description?: string): Promise<StoreResponse> {
  const response = await axiosInstance.post<StoreResponse>('/api/v1/stores', { name, description });
  return response.data;
}

export function getStoreStatusStyle(status: string): { bg: string; text: string } {
  switch (status) {
    case 'Approved': return { bg: '#E3EEE6', text: '#2F6F4F' };
    case 'Pending': return { bg: '#F6EAD2', text: '#A87420' };
    case 'Suspended': return { bg: '#F0ECE2', text: '#8A8273' };
    case 'Rejected': return { bg: '#F3E1DC', text: '#B14A2D' };
    default: return { bg: '#F0ECE2', text: '#8A8273' };
  }
}