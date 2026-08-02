import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Loader2, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchCart,
  updateCartItem,
  removeCartItem,
  applyCoupon,
  removeCoupon,
} from '../api/cartApi';
import type { CartItem } from '../types/cart';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  getGuestCart,
  setGuestCartQty,
  removeFromGuestCart,
  type GuestCartItem,
} from '../lib/guestCart';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';

const inkText = { color: '#1F2A24', fontFamily: "'Inter', sans-serif" };
const mutedText = { color: '#8A8273', fontFamily: "'Inter', sans-serif" };
const labelMono = {
  color: '#8A8273',
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function ServerCart() {
  const queryClient = useQueryClient();
  const [couponInput, setCouponInput] = useState('');
  const [pendingQty, setPendingQty] = useState<Record<number, 'inc' | 'dec'>>({});

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
    refetchOnWindowFocus: true,
  });

  const updateQtyMutation = useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: number; quantity: number }): Promise<void> => {
      quantity === 0 ? await removeCartItem(cartItemId) : await updateCartItem(cartItemId, quantity);
    },
    onMutate: ({ cartItemId, quantity }) => {
      const currentQty = cart?.items.find(i => i.id === cartItemId)?.quantity ?? 0;
      setPendingQty((prev) => ({ ...prev, [cartItemId]: quantity > currentQty ? 'inc' : 'dec' }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: () => {
      toast.error('Could not update cart. Please try again.');
    },
    onSettled: (_, __, { cartItemId }) => {
      setPendingQty((prev) => {
        const next = { ...prev };
        delete next[cartItemId];
        return next;
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (cartItemId: number) => removeCartItem(cartItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Item removed.');
    },
    onError: () => {
      toast.error('Could not remove item.');
    },
  });

  const applyCouponMutation = useMutation({
    mutationFn: () => applyCoupon(couponInput.trim()),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(['cart'], updatedCart);
      toast.success('Coupon applied!');
    },
    onError: () => {
      toast.error('Invalid or expired coupon code.');
    },
  });

  const removeCouponMutation = useMutation({
    mutationFn: removeCoupon,
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(['cart'], updatedCart);
      setCouponInput('');
      toast.success('Coupon removed.');
    },
    onError: () => {
      toast.error('Could not remove coupon.');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FBF7F0' }}>
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-4">
          <Skeleton className="h-8 w-40 mb-4" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  const items = cart?.items ?? [];
  const isEmpty = items.length === 0;

  if (isEmpty) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FBF7F0' }}>
        <EmptyState
          icon={<ShoppingCart size={64} color="#D9CFC0" />}
          title="Your cart is empty"
          ctaLabel="Shop Now"
          ctaTo="/products"
        />
      </div>
    );
  }

  // Group items by store
  const storeGroups = items.reduce<Record<number, { storeName: string; storeSlug: string; items: CartItem[] }>>((acc, item) => {
    if (!acc[item.storeId]) {
      acc[item.storeId] = { storeName: item.storeName, storeSlug: item.storeSlug, items: [] };
    }
    acc[item.storeId].items.push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FBF7F0' }}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl mb-8" style={{ color: '#1F2A24', fontFamily: "'Fraunces', serif", fontWeight: 500 }}>
          Your cart
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart items grouped by store */}
          <div className="flex-1 flex flex-col gap-6">
            {Object.entries(storeGroups).map(([storeId, group]) => (
              <div key={storeId}>
                {/* Store header */}
                <div className="flex items-center gap-2 mb-3">
                  <span style={labelMono}>Sold by</span>
                  <Link
                    to={`/stores/${group.storeSlug}`}
                    className="text-sm font-medium hover:underline"
                    style={{ color: '#D97B3F', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  >
                    {group.storeName}
                  </Link>
                </div>

                {/* Items in this store */}
                <div className="flex flex-col gap-3">
                  {group.items.map((item) => {
                    const isPendingInc = pendingQty[item.id] === 'inc' && updateQtyMutation.isPending;
                    const isPendingDec = pendingQty[item.id] === 'dec' && updateQtyMutation.isPending;
                    const isRemoving = removeMutation.isPending && removeMutation.variables === item.id;

                    return (
                      <div key={item.id} className="flex items-center gap-4 p-4 rounded-lg" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4DCC9' }}>
                        <div className="w-16 h-16 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F0ECE2' }}>
                          <span style={labelMono}>IMG</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <Link to={`/products/${item.productId}`} className="text-sm font-medium hover:underline truncate block" style={inkText}>
                            {item.productName}
                          </Link>
                          <p className="text-sm mt-1" style={mutedText}>{formatPrice(item.unitPrice)} each</p>
                        </div>

                        {/* Quantity stepper */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQtyMutation.mutate({ cartItemId: item.id, quantity: item.quantity - 1 })}
                            disabled={updateQtyMutation.isPending}
                            className="w-8 h-8 rounded flex items-center justify-center disabled:opacity-50"
                            style={{ border: '1px solid #E4DCC9', backgroundColor: '#FBF7F0' }}
                          >
                            {isPendingDec ? <Loader2 size={12} className="animate-spin" /> : <span style={inkText}>−</span>}
                          </button>
                          <input type="number" value={item.quantity} readOnly className="w-10 text-center text-sm rounded" style={{ border: '1px solid #E4DCC9', backgroundColor: '#FFFFFF', ...inkText }} />
                          <button
                            onClick={() => updateQtyMutation.mutate({ cartItemId: item.id, quantity: item.quantity + 1 })}
                            disabled={updateQtyMutation.isPending}
                            className="w-8 h-8 rounded flex items-center justify-center disabled:opacity-50"
                            style={{ border: '1px solid #E4DCC9', backgroundColor: '#FBF7F0' }}
                          >
                            {isPendingInc ? <Loader2 size={12} className="animate-spin" /> : <span style={inkText}>+</span>}
                          </button>
                        </div>

                        <p className="text-sm font-medium w-20 text-right" style={inkText}>{formatPrice(item.subtotal)}</p>

                        <button onClick={() => removeMutation.mutate(item.id)} disabled={isRemoving} className="ml-2 disabled:opacity-50">
                          {isRemoving ? <Loader2 size={16} className="animate-spin" color="#8A8273" /> : <Trash2 size={16} color="#8A8273" />}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Store subtotal */}
                <div className="flex justify-end mt-2 pr-1">
                  <span style={{ ...mutedText, fontSize: '13px' }}>
                    Store subtotal: {formatPrice(group.items.reduce((s, i) => s + i.subtotal, 0))}
                  </span>
                </div>
              </div>
            ))}

            {/* Coupon section */}
            <div className="p-4 rounded-lg mt-2" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4DCC9' }}>
              <p style={labelMono} className="mb-3">Have a coupon code?</p>
              {cart?.couponCode ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm px-3 py-1 rounded-full" style={{ backgroundColor: '#E3EEE6', color: '#2F6F4F', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px' }}>
                    {cart.couponCode} applied — {cart.discountPercentage}% off
                  </span>
                  <button onClick={() => removeCouponMutation.mutate()} disabled={removeCouponMutation.isPending} className="text-sm underline disabled:opacity-50" style={{ color: '#B14A2D', fontFamily: "'Inter', sans-serif" }}>
                    {removeCouponMutation.isPending ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input type="text" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Enter code" className="flex-1 px-3 py-2 text-sm rounded-md" style={{ border: '1px solid #E4DCC9', backgroundColor: '#FBF7F0', ...inkText }} />
                  <button onClick={() => applyCouponMutation.mutate()} disabled={!couponInput.trim() || applyCouponMutation.isPending} className="px-4 py-2 text-sm rounded-md disabled:opacity-50" style={{ backgroundColor: '#2F6F4F', color: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}>
                    {applyCouponMutation.isPending ? 'Applying…' : 'Apply'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:w-72 h-fit p-6 rounded-lg" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4DCC9' }}>
            <h2 className="text-lg mb-4" style={{ color: '#1F2A24', fontFamily: "'Fraunces', serif", fontWeight: 500 }}>Order summary</h2>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-sm" style={inkText}>
                <span style={mutedText}>Subtotal</span>
                <span>{formatPrice(cart?.subtotal ?? 0)}</span>
              </div>

              {cart?.couponCode && cart.discountAmount != null && (
                <div className="flex justify-between text-sm">
                  <span style={mutedText}>Discount ({cart.couponCode})</span>
                  <span style={{ color: '#2F6F4F', fontFamily: "'Inter', sans-serif" }}>−{formatPrice(cart.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between pt-3 mt-1" style={{ borderTop: '1px solid #E4DCC9' }}>
                <span className="text-base font-medium" style={inkText}>Total</span>
                <span className="text-lg font-medium" style={{ color: '#1F2A24', fontFamily: "'Fraunces', serif" }}>{formatPrice(cart?.finalTotal ?? 0)}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              className={`mt-6 w-full block text-center px-6 py-3 rounded-md text-sm ${isEmpty ? 'pointer-events-none opacity-50' : ''}`}
              style={{ backgroundColor: '#2F6F4F', color: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}
            >
              Proceed to checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Guest cart — backed by localStorage. Mirrors the server cart's layout but with
// client-side quantity math and no coupons (those need an account). "Proceed to
// checkout" routes into the protected checkout, which prompts sign-in; the local
// cart is merged into the real cart right after login.
function GuestCartView() {
  const { setItemCount } = useCart();
  const [items, setItems] = useState<GuestCartItem[]>(() => getGuestCart());

  function sync() {
    const next = getGuestCart();
    setItems(next);
    setItemCount(next.reduce((sum, i) => sum + i.quantity, 0));
  }

  function changeQty(productId: number, quantity: number) {
    setGuestCartQty(productId, quantity);
    sync();
  }

  function remove(productId: number) {
    removeFromGuestCart(productId);
    sync();
    toast.success('Item removed.');
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FBF7F0' }}>
        <EmptyState
          icon={<ShoppingCart size={64} color="#D9CFC0" />}
          title="Your cart is empty"
          ctaLabel="Shop Now"
          ctaTo="/products"
        />
      </div>
    );
  }

  const storeGroups = items.reduce<Record<number, { storeName: string; storeSlug: string; items: GuestCartItem[] }>>((acc, item) => {
    if (!acc[item.storeId]) {
      acc[item.storeId] = { storeName: item.storeName, storeSlug: item.storeSlug, items: [] };
    }
    acc[item.storeId].items.push(item);
    return acc;
  }, {});

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FBF7F0' }}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl mb-8" style={{ color: '#1F2A24', fontFamily: "'Fraunces', serif", fontWeight: 500 }}>
          Your cart
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-6">
            {Object.entries(storeGroups).map(([storeId, group]) => (
              <div key={storeId}>
                <div className="flex items-center gap-2 mb-3">
                  <span style={labelMono}>Sold by</span>
                  <Link
                    to={`/stores/${group.storeSlug}`}
                    className="text-sm font-medium hover:underline"
                    style={{ color: '#D97B3F', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  >
                    {group.storeName}
                  </Link>
                </div>

                <div className="flex flex-col gap-3">
                  {group.items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-4 p-4 rounded-lg" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4DCC9' }}>
                      <div className="w-16 h-16 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F0ECE2' }}>
                        <span style={labelMono}>IMG</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link to={`/products/${item.productId}`} className="text-sm font-medium hover:underline truncate block" style={inkText}>
                          {item.productName}
                        </Link>
                        <p className="text-sm mt-1" style={mutedText}>{formatPrice(item.unitPrice)} each</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => changeQty(item.productId, item.quantity - 1)}
                          className="w-8 h-8 rounded flex items-center justify-center"
                          style={{ border: '1px solid #E4DCC9', backgroundColor: '#FBF7F0' }}
                        >
                          <span style={inkText}>−</span>
                        </button>
                        <input type="number" value={item.quantity} readOnly className="w-10 text-center text-sm rounded" style={{ border: '1px solid #E4DCC9', backgroundColor: '#FFFFFF', ...inkText }} />
                        <button
                          onClick={() => changeQty(item.productId, item.quantity + 1)}
                          className="w-8 h-8 rounded flex items-center justify-center"
                          style={{ border: '1px solid #E4DCC9', backgroundColor: '#FBF7F0' }}
                        >
                          <span style={inkText}>+</span>
                        </button>
                      </div>

                      <p className="text-sm font-medium w-20 text-right" style={inkText}>{formatPrice(item.unitPrice * item.quantity)}</p>

                      <button onClick={() => remove(item.productId)} className="ml-2">
                        <Trash2 size={16} color="#8A8273" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mt-2 pr-1">
                  <span style={{ ...mutedText, fontSize: '13px' }}>
                    Store subtotal: {formatPrice(group.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0))}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:w-72 h-fit p-6 rounded-lg" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4DCC9' }}>
            <h2 className="text-lg mb-4" style={{ color: '#1F2A24', fontFamily: "'Fraunces', serif", fontWeight: 500 }}>Order summary</h2>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-sm" style={inkText}>
                <span style={mutedText}>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <div className="flex justify-between pt-3 mt-1" style={{ borderTop: '1px solid #E4DCC9' }}>
                <span className="text-base font-medium" style={inkText}>Total</span>
                <span className="text-lg font-medium" style={{ color: '#1F2A24', fontFamily: "'Fraunces', serif" }}>{formatPrice(subtotal)}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="mt-6 w-full block text-center px-6 py-3 rounded-md text-sm"
              style={{ backgroundColor: '#2F6F4F', color: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}
            >
              Proceed to checkout
            </Link>
            <p className="mt-3 text-center" style={{ ...mutedText, fontSize: '12px' }}>
              Sign in at checkout to apply coupons and place your order.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Signed-in shoppers use the real server cart; guests get the local one.
function CartPage() {
  const { user } = useAuth();
  return user ? <ServerCart /> : <GuestCartView />;
}

export default CartPage;