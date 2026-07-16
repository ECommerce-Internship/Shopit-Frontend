// Types for the seller order fulfillment UI. Mirrors SellerStoreOrderResponse
// and the OrderStatus enum on the backend.

export type OrderItem = {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export type SellerStoreOrder = {
  storeOrderId: number;
  orderId: number;
  storeId: number;
  storeName: string;
  status: OrderStatus;
  subTotal: number;
  commissionAmount: number;
  sellerNetAmount: number;
  shippingAddress: string;
  createdAt: string;
  items: OrderItem[];
};

// Mirrors OrderService.UpdateStoreOrderStatusAsync's validProgressions exactly.
// Used to only show buttons for transitions the backend will actually accept —
// the backend re-validates regardless, this is just so a seller isn't shown a
// button that will 400.
const VALID_PROGRESSIONS: Record<OrderStatus, OrderStatus[]> = {
  Pending: ['Processing', 'Cancelled'],
  Processing: ['Shipped'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

export function getValidNextStatuses(current: OrderStatus): OrderStatus[] {
  return VALID_PROGRESSIONS[current];
}

export function getOrderStatusStyle(status: string): { bg: string; text: string } {
  switch (status) {
    case 'Pending': return { bg: '#F6EAD2', text: '#A87420' };
    case 'Processing': return { bg: '#DCE7F0', text: '#2F5F8A' };
    case 'Shipped': return { bg: '#E3EEE6', text: '#2F6F4F' };
    case 'Delivered': return { bg: '#2F6F4F', text: '#FFFFFF' };
    case 'Cancelled': return { bg: '#F3E1DC', text: '#B14A2D' };
    default: return { bg: '#F0ECE2', text: '#8A8273' };
  }
}
