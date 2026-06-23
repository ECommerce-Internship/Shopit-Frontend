import axiosInstance from './axiosInstance';

export type UserProfile = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  hasPassword: boolean;
  createdAt: string;
};

export type UpdateProfilePayload = {
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export async function fetchProfile(): Promise<UserProfile> {
  const response = await axiosInstance.get<UserProfile>('/api/v1/auth/me');
  return response.data;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  const response = await axiosInstance.put<UserProfile>('/api/v1/auth/me', payload);
  return response.data;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  // skipAuthRefresh: a 401 here means "wrong current password", not an expired
  // session, so we don't want the interceptor's refresh/logout flow to hijack it.
  await axiosInstance.post('/api/v1/auth/change-password', payload, {
    skipAuthRefresh: true,
  } as never);
}