export type CartItem = {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

export type Cart = {
  id: number;
  items: CartItem[];
  subtotal: number;
  couponCode: string | null;
  discountPercentage: number | null;
  discountAmount: number | null;
  finalTotal: number;
};