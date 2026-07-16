import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getOrderById, cancelOrder, type OrderItem } from '../api/orderApi';
import { getPaymentByOrderId, getPaymentStatusLabel, getPaymentMethodLabel, getPaymentStatusStyle } from '../api/paymentApi';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

type BadgeColors = { bg: string; fg: string; dot: string };
function badgeColors(status: string): BadgeColors {
  const map: Record<string, BadgeColors> = {
    Pending:    { bg: '#FBF3D6', fg: '#8A6D12', dot: '#D9A81E' },
    Processing: { bg: '#E1ECFB', fg: '#2B5A99', dot: '#3B7BD6' },
    Confirmed:  { bg: '#E1ECFB', fg: '#2B5A99', dot: '#3B7BD6' },
    Shipped:    { bg: '#ECE5F8', fg: '#5B3F97', dot: '#7C5BC7' },
    Delivered:  { bg: '#DEEEE5', fg: '#2F6F4F', dot: '#2F6F4F' },
    Cancelled:  { bg: '#F8E1DE', fg: '#A23D30', dot: '#C8523F' },
  };
  return map[status] || map['Pending'];
}

function StatusBadge({ status }: { status: string }) {
  const c = badgeColors(status);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '4px 11px', borderRadius: '999px',
      fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600,
      letterSpacing: '0.01em', background: c.bg, color: c.fg,
      textDecoration: status === 'Cancelled' ? 'line-through' : 'none',
    }}>
      <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: c.dot }}></span>
      {status}
    </span>
  );
}

const FLOW = ['Pending', 'Processing', 'Shipped', 'Delivered'];

function ProgressBar({ status }: { status: string }) {
  const isCancelled = status.toLowerCase() === 'cancelled';
  const currentIdx = isCancelled ? -1 : Math.max(0, FLOW.findIndex(s => s.toLowerCase() === status.toLowerCase()));
  const pct = currentIdx / (FLOW.length - 1);
  const fillWidth = `${75 * pct}%`;

  if (isCancelled) {
    return (
      <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#F8E1DE', border: '1px solid #e9c8b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#A23D30', display: 'inline-block' }}></span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#A23D30', fontWeight: 600 }}>Order Cancelled</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
      {/* Track background */}
      <div style={{ position: 'absolute', top: '15px', left: '12.5%', right: '12.5%', height: '3px', background: '#EFE9DB', borderRadius: '3px' }}></div>
      {/* Track fill */}
      <div style={{ position: 'absolute', top: '15px', left: '12.5%', width: fillWidth, height: '3px', background: '#2F6F4F', borderRadius: '3px', transition: 'width 0.4s ease' }}></div>

      {FLOW.map((label, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const reached = i <= currentIdx;
        let nodeStyle: React.CSSProperties = {
          width: '32px', height: '32px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontFamily: "'Inter', sans-serif", fontWeight: 600,
          transition: 'box-shadow 0.2s ease, transform 0.2s cubic-bezier(.34,1.56,.64,1)',
          cursor: 'default',
        };
        if (active) {
          nodeStyle = { ...nodeStyle, background: '#2F6F4F', color: '#FBF7F0', border: '3px solid #C7DDD0', boxShadow: '0 0 0 3px rgba(47,111,79,0.18)' };
        } else if (done) {
          nodeStyle = { ...nodeStyle, background: '#2F6F4F', color: '#FBF7F0', border: '3px solid #FFFFFF' };
        } else {
          nodeStyle = { ...nodeStyle, background: '#FFFFFF', color: '#C9C1AF', border: '3px solid #EFE9DB' };
        }
        return (
          <div key={label} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div className="progress-node" style={nodeStyle}>{done ? '✓' : i + 1}</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: reached ? 600 : 500, color: reached ? '#1F2A24' : '#8A8273' }}>{label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CancelModal({ orderId, onConfirm, onCancel, isPending }: {
  orderId: number; onConfirm: () => void; onCancel: () => void; isPending: boolean;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(31,42,36,0.42)', backdropFilter: 'blur(2px)' }}>
      <div style={{ width: '400px', maxWidth: '100%', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '20px', padding: '28px', textAlign: 'center' }}>
        <div style={{ width: '54px', height: '54px', margin: '0 auto 18px', borderRadius: '50%', background: '#F8E1DE', border: '1px solid #e9c8b8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A23D30', fontSize: '22px' }}>✕</div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8273', marginBottom: '10px' }}>Cancel Order</div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '24px', margin: '0 0 12px', color: '#1F2A24' }}>Cancel this order?</h2>
        <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#5c5648', margin: '0 auto 24px', maxWidth: '300px' }}>
          Are you sure you want to cancel order{' '}
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#1F2A24' }}>#{orderId.toString().padStart(8, '0')}</span>?{' '}
          This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onCancel} disabled={isPending} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #E4DCC9', background: '#fff', color: '#1F2A24', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Keep Order</button>
          <button onClick={onConfirm} disabled={isPending} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #B14A2D', background: '#B14A2D', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Cancel Order
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);

  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderById(Number(id)),
    enabled: !!id,
  });

  const { data: payment, isLoading: paymentLoading } = useQuery({
    queryKey: ['payment', id],
    queryFn: () => getPaymentByOrderId(Number(id)),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      setShowCancelModal(false);
      toast.success('Order cancelled successfully.');
    },
    onError: () => {
      toast.error('Could not cancel order. Please try again.');
    },
  });

  if (orderLoading || paymentLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FBF7F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#8A8273', fontFamily: "'Inter', sans-serif" }}>Loading order…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ minHeight: '100vh', background: '#FBF7F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <p style={{ color: '#B14A2D', fontFamily: "'Inter', sans-serif" }}>Order not found.</p>
        <Link to="/orders" style={{ color: '#2F6F4F', fontFamily: "'Inter', sans-serif" }}>Back to Orders</Link>
      </div>
    );
  }

  const isPending = order.status.toLowerCase() === 'pending';
  const badge = badgeColors(order.status);
  const statusStyle = payment ? getPaymentStatusStyle(payment.status) : null;
  const hasStoreOrders = order.storeOrders && order.storeOrders.length > 0;
  const totalItems = hasStoreOrders
    ? order.storeOrders.reduce((s, so) => s + so.items.length, 0)
    : order.items.length;

  return (
    <div style={{ minHeight: '100vh', background: '#FBF7F0', fontFamily: "'Inter', sans-serif", color: '#1F2A24', padding: '48px 40px 80px', display: 'flex', justifyContent: 'center' }}>
      <style>{`
        .cancel-btn:hover { background: #B14A2D !important; color: #FBF7F0 !important; transform: translateY(-2px); box-shadow: 0 10px 22px -10px rgba(177,74,45,0.8); }
        .cancel-btn:active { transform: translateY(0) scale(0.97) !important; }
        .item-row:hover { background: #FCFAF4 !important; }
        .progress-node:hover { box-shadow: 0 0 0 6px rgba(47,111,79,0.14) !important; transform: scale(1.12) !important; }
        .progress-node { transition: box-shadow 0.2s ease, transform 0.2s cubic-bezier(.34,1.56,.64,1); }
      `}</style>

      {showCancelModal && (
        <CancelModal
          orderId={order.id}
          onConfirm={() => cancelMutation.mutate()}
          onCancel={() => setShowCancelModal(false)}
          isPending={cancelMutation.isPending}
        />
      )}

      <div style={{ width: '100%', maxWidth: '980px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#8A8273' }}>
          <Link to="/orders" style={{ color: '#8A8273', textDecoration: 'none' }}>My Orders</Link>
          <span>/</span>
          <span style={{ color: '#1F2A24' }}>#{order.id.toString().padStart(8, '0')}</span>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap', marginBottom: '36px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 13px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, background: badge.bg, color: badge.fg }}>
                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: badge.dot }}></span>
                {order.status}
              </span>
            </div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '44px', lineHeight: 1.02, letterSpacing: '-0.01em', margin: '0 0 6px' }}>
              #{order.id.toString().padStart(8, '0')}
            </h1>
            <p style={{ fontSize: '14px', color: '#8A8273', margin: 0 }}>
              Placed on {formatDate(order.createdAt)} · {totalItems} {totalItems === 1 ? 'item' : 'items'}
              {hasStoreOrders && ` · ${order.storeOrders.length} ${order.storeOrders.length === 1 ? 'store' : 'stores'}`}
            </p>
          </div>

          {isPending && (
            <button
              className="cancel-btn"
              onClick={() => setShowCancelModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 22px', borderRadius: '999px', border: '1px solid #B14A2D', background: '#FFFFFF', color: '#B14A2D', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'transform 0.18s cubic-bezier(.34,1.56,.64,1), background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease' }}
            >
              Cancel Order
            </button>
          )}
        </div>

        {/* Progress tracker */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E4DCC9', borderRadius: '16px', padding: '34px 40px 30px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', gap: '16px', flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8A8273', margin: 0 }}>Order Progress</h2>
            {hasStoreOrders && (
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#8A8273' }}>
                Overall status rolled up across {order.storeOrders.length} {order.storeOrders.length === 1 ? 'store' : 'stores'}
              </span>
            )}
          </div>
          <ProgressBar status={order.status} />
        </div>

        {/* Two-column body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '24px', alignItems: 'start' }}>

          {/* LEFT: items by store + totals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {hasStoreOrders ? (
              order.storeOrders.map((storeOrder) => (
                <div key={storeOrder.storeId} style={{ background: '#FFFFFF', border: '1px solid #E4DCC9', borderRadius: '16px', overflow: 'hidden' }}>
                  {/* Store header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '18px 24px', borderBottom: '1px solid #E4DCC9', background: '#FBF7F0' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: '#2F6F4F', color: '#FBF7F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '14px' }}>
                      {storeOrder.storeName.charAt(0)}
                    </div>
                    <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '17px' }}>{storeOrder.storeName}</span>
                    <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#8A8273' }}>
                        {storeOrder.items.length} {storeOrder.items.length === 1 ? 'item' : 'items'}
                      </span>
                      <StatusBadge status={storeOrder.status} />
                    </span>
                  </div>

                  {/* Item head */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2.6fr 0.7fr 1fr 1fr', gap: '12px', padding: '12px 24px', borderBottom: '1px solid #F0EADC', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8273' }}>
                    <div>Product</div>
                    <div style={{ textAlign: 'center' }}>Qty</div>
                    <div style={{ textAlign: 'right' }}>Unit</div>
                    <div style={{ textAlign: 'right' }}>Total</div>
                  </div>

                  {storeOrder.items.map((item: OrderItem) => (
                    <div key={item.id} className="item-row" style={{ display: 'grid', gridTemplateColumns: '2.6fr 0.7fr 1fr 1fr', gap: '12px', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #F6F1E6', transition: 'background 0.15s ease' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '9px', background: 'repeating-linear-gradient(45deg, #F3EEE1, #F3EEE1 5px, #EDE6D5 5px, #EDE6D5 10px)', border: '1px solid #E4DCC9', flexShrink: 0 }}></div>
                        <div>
                          <span style={{ fontSize: '14px', color: '#1F2A24' }}>{item.productName}</span>
                          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#C2BBAA', marginTop: '2px' }}>price at time of order</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}>{item.quantity}</div>
                      <div style={{ textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#8A8273' }}>{formatPrice(item.unitPrice)}</div>
                      <div style={{ textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', fontWeight: 500 }}>{formatPrice(item.subtotal)}</div>
                    </div>
                  ))}

                  {/* Store subtotal */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', background: '#FBF7F0' }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8273' }}>Store subtotal</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', fontWeight: 500 }}>{formatPrice(storeOrder.subTotal)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ background: '#FFFFFF', border: '1px solid #E4DCC9', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2.6fr 0.7fr 1fr 1fr', gap: '12px', padding: '12px 24px', borderBottom: '1px solid #F0EADC', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8273' }}>
                  <div>Product</div><div style={{ textAlign: 'center' }}>Qty</div><div style={{ textAlign: 'right' }}>Unit</div><div style={{ textAlign: 'right' }}>Total</div>
                </div>
                {order.items.map((item) => (
                  <div key={item.id} className="item-row" style={{ display: 'grid', gridTemplateColumns: '2.6fr 0.7fr 1fr 1fr', gap: '12px', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #F6F1E6', transition: 'background 0.15s ease' }}>
                    <span style={{ fontSize: '14px', color: '#1F2A24' }}>{item.productName}</span>
                    <div style={{ textAlign: 'center', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}>{item.quantity}</div>
                    <div style={{ textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#8A8273' }}>{formatPrice(item.unitPrice)}</div>
                    <div style={{ textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', fontWeight: 500 }}>{formatPrice(item.subtotal)}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Order totals */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E4DCC9', borderRadius: '16px', padding: '22px 24px' }}>
              {order.discountAmount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span style={{ fontSize: '14px', color: '#8A8273' }}>Discount</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', color: '#2F6F4F' }}>−{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', marginTop: '6px', borderTop: '1px solid #E4DCC9' }}>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: '17px', fontWeight: 600 }}>Total</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '17px', fontWeight: 500 }}>{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* RIGHT: payment + shipping */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Payment */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E4DCC9', borderRadius: '16px', padding: '22px 24px' }}>
              <h3 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8A8273', margin: '0 0 18px' }}>Payment</h3>
              {payment ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: '#8A8273' }}>Method</span>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{getPaymentMethodLabel(payment.method)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: '#8A8273' }}>Status</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 11px', borderRadius: '999px', background: statusStyle?.bg, color: statusStyle?.text, fontSize: '12px', fontWeight: 600 }}>
                      {getPaymentStatusLabel(payment.status)}
                    </span>
                  </div>
                  {payment.transactionRef && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <span style={{ fontSize: '13px', color: '#8A8273' }}>Transaction ID</span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#1F2A24' }}>{payment.transactionRef}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ color: '#8A8273', fontSize: '13px', margin: 0 }}>No payment info available.</p>
              )}
            </div>

            {/* Shipping address */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E4DCC9', borderRadius: '16px', padding: '22px 24px' }}>
              <h3 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8A8273', margin: '0 0 16px' }}>Shipping Address</h3>
              <div style={{ fontSize: '14px', lineHeight: 1.6, color: '#1F2A24' }}>{order.shippingAddress}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailPage;