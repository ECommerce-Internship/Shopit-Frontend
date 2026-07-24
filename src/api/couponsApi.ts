import axiosInstance from './axiosInstance';

// Coupons are managed by Admins and Sellers (see CouponController — the whole
// controller is [Authorize(Roles = "Admin,Seller")]). A seller may only create
// coupons scoped to a store they own; an admin may leave the store null for a
// platform-wide coupon or target any store.

export type CouponDiscountType = 'Percent' | 'Fixed';

// The backend has no JsonStringEnumConverter registered, so System.Text.Json
// (de)serializes CouponDiscountType by its integer value on the wire. Requests
// must send the number; responses come back as the string name (the DTO maps it
// with .ToString()), hence the asymmetry below.
const DISCOUNT_TYPE_VALUE: Record<CouponDiscountType, number> = {
  Percent: 0,
  Fixed: 1,
};

export type Coupon = {
  id: number;
  code: string;
  discountType: string; // "Percent" | "Fixed"
  discountValue: number;
  minimumOrderAmount: number | null;
  usageLimit: number | null;
  usageCount: number;
  expiresAt: string | null;
  isActive: boolean;
  storeId: number | null;
};

export type CreateCouponRequest = {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minimumOrderAmount?: number | null;
  usageLimit?: number | null;
  expiresAt?: string | null;
  storeId?: number | null;
};

// Sellers see only coupons for stores they own; admins see all (backend scopes
// the result by role, so the same endpoint serves both).
export async function fetchCoupons(): Promise<Coupon[]> {
  const response = await axiosInstance.get<Coupon[]>('/api/v1/coupons');
  return response.data;
}

export async function createCoupon(request: CreateCouponRequest): Promise<Coupon> {
  const response = await axiosInstance.post<Coupon>('/api/v1/coupons', {
    code: request.code,
    discountType: DISCOUNT_TYPE_VALUE[request.discountType],
    discountValue: request.discountValue,
    minimumOrderAmount: request.minimumOrderAmount ?? null,
    usageLimit: request.usageLimit ?? null,
    expiresAt: request.expiresAt ?? null,
    storeId: request.storeId ?? null,
  });
  return response.data;
}

export async function deactivateCoupon(id: number): Promise<Coupon> {
  const response = await axiosInstance.put<Coupon>(`/api/v1/coupons/${id}/deactivate`);
  return response.data;
}
