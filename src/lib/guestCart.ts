// A client-side cart for shoppers who haven't signed in yet. Browsing and adding
// to the cart are public; only checkout requires an account. Items live in
// localStorage as lightweight snapshots (enough to render the cart without extra
// requests) and are replayed onto the real server cart the moment the user signs
// in — see mergeGuestCartIntoServer, called from the login flows.
import { addCartItem } from '../api/cartApi';

export type GuestCartItem = {
  productId: number;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  storeId: number;
  storeName: string;
  storeSlug: string;
};

const KEY = 'shopit.guestCart';
// Fired on every write so same-tab listeners (e.g. the cart badge) can refresh;
// the native `storage` event only fires in *other* tabs.
export const GUEST_CART_EVENT = 'shopit:guest-cart-changed';

function read(): GuestCartItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GuestCartItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: GuestCartItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable — the guest cart just won't persist.
  }
  window.dispatchEvent(new Event(GUEST_CART_EVENT));
}

export function getGuestCart(): GuestCartItem[] {
  return read();
}

export function guestCartCount(): number {
  return read().reduce((sum, item) => sum + item.quantity, 0);
}

export function addToGuestCart(item: Omit<GuestCartItem, 'quantity'>, quantity: number) {
  const items = read();
  const existing = items.find((i) => i.productId === item.productId);
  if (existing) existing.quantity += quantity;
  else items.push({ ...item, quantity });
  write(items);
}

export function setGuestCartQty(productId: number, quantity: number) {
  let items = read();
  if (quantity <= 0) {
    items = items.filter((i) => i.productId !== productId);
  } else {
    const it = items.find((i) => i.productId === productId);
    if (it) it.quantity = quantity;
  }
  write(items);
}

export function removeFromGuestCart(productId: number) {
  write(read().filter((i) => i.productId !== productId));
}

export function clearGuestCart() {
  write([]);
}

/**
 * After sign-in, replay the local cart onto the server cart, then clear it.
 * Best-effort: individual items that fail (e.g. now out of stock) are skipped.
 * Returns the resulting server item count, or null when there was nothing to merge.
 */
export async function mergeGuestCartIntoServer(): Promise<number | null> {
  const items = read();
  if (items.length === 0) return null;

  let lastCount: number | null = null;
  for (const item of items) {
    try {
      const cart = await addCartItem(item.productId, item.quantity);
      lastCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    } catch {
      // Skip items that can't be added; keep merging the rest.
    }
  }
  clearGuestCart();
  return lastCount;
}
