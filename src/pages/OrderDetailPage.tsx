import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getOrderById } from '../api/orderApi';
import {
  getPaymentByOrderId,
  refundPayment,
  getPaymentStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusStyle,
} from '../api/paymentApi';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function RefundModal({
  onConfirm, onCancel, isPending, orderId,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
  orderId: number;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(31,42,36,0.42)', backdropFilter: 'blur(2px)' }}>
      <div style={{ position: 'relative', width: '400px', maxWidth: '100%', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '20px', boxShadow: '0 24px 60px rgba(31,42,36,0.20)', padding: '28px', textAlign: 'center' }}>
        <div style={{ width: '54px', height: '54px', margin: '0 auto 18px', borderRadius: '50%', background: '#FBEEE8', border: '1px solid #e9c8b8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B14A2D', fontSize: '24px' }}>↺</div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8273', marginBottom: '10px' }}>Refund Request</div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '26px', lineHeight: 1.1, margin: '0 0 12px', color: '#1F2A24' }}>Request a Refund</h2>
        <p style={{ fontSize: '14.5px', lineHeight: 1.6, color: '#5c5648', margin: '0 auto 26px', maxWidth: '300px' }}>
          Are you sure you want to request a refund for order{' '}
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#1F2A24' }}>
            #{orderId.toString().padStart(8, '0')}
          </span>? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onCancel}
            disabled={isPending}
            style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #E4DCC9', background: '#fff', color: '#1F2A24', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #B14A2D', background: '#B14A2D', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Confirm Refund
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showRefundModal, setShowRefundModal] = useState(false);

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

  const refundMutation = useMutation({
    mutationFn: () => refundPayment(payment!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment', id] });
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      setShowRefundModal(false);
      toast.success('Refund requested successfully.');
    },
    onError: () => {
      toast.error('Could not process refund. Please try again.');
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

  const statusStyle = payment ? getPaymentStatusStyle(payment.status) : null;
  const isEligibleForRefund = payment?.status === 1;

  const orderStatusStyle = order.status === 'Delivered'
    ? { bg: '#EAF2EC', border: '#cfe2d6', color: '#2F6F4F' }
    : order.status === 'Pending'
    ? { bg: '#FBF3DE', border: '#ecd9a3', color: '#9A7B16' }
    : { bg: '#EFEDE7', border: '#dcd8cd', color: '#7A746A' };

  return (
    <div style={{ minHeight: '100vh', background: '#FBF7F0', fontFamily: "'Inter', sans-serif", color: '#1F2A24', display: 'flex', justifyContent: 'center', padding: 0 }}>
      {showRefundModal && payment && (
        <RefundModal
          onConfirm={() => refundMutation.mutate()}
          onCancel={() => setShowRefundModal(false)}
          isPending={refundMutation.isPending}
          orderId={order.id}
        />
      )}

      <div style={{ width: '440px', maxWidth: '100%', minHeight: '100vh', background: '#FBF7F0', display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '20px 24px 12px' }}>
          <Link to="/orders" style={{ width: '38px', height: '38px', border: '1px solid #E4DCC9', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1F2A24', textDecoration: 'none' }}>
            <ArrowLeft size={16} />
          </Link>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8273' }}>Shopit · Order</div>
        </div>

        {/* Header */}
        <div style={{ padding: '8px 24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', letterSpacing: '0.08em', color: '#8A8273', marginBottom: '6px' }}>ORDER ID</div>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '30px', lineHeight: 1.05, margin: 0, color: '#1F2A24' }}>
                #{order.id.toString().padStart(8, '0')}
              </h1>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: orderStatusStyle.bg, border: `1px solid ${orderStatusStyle.border}`, color: orderStatusStyle.color, padding: '7px 12px', borderRadius: '999px', fontSize: '12.5px', fontWeight: 600, whiteSpace: 'nowrap', marginTop: '22px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: orderStatusStyle.color, display: 'inline-block' }}></span>
              {order.status}
            </div>
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#8A8273', marginTop: '12px' }}>
            Placed {formatDate(order.createdAt)} · {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
          </div>
        </div>

        {/* Items card */}
        <div style={{ padding: '0 24px' }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8273', marginBottom: '10px' }}>Items</div>
          <div style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', overflow: 'hidden' }}>
            {order.items.map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', borderBottom: '1px solid #F1EAD9' }}>
                <div style={{ width: '60px', height: '60px', flex: '0 0 auto', borderRadius: '11px', background: 'repeating-linear-gradient(45deg,#F4EEDF,#F4EEDF 6px,#EDE5D2 6px,#EDE5D2 12px)', border: '1px solid #E4DCC9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono', monospace", fontSize: '8px', color: '#A89F8B', textAlign: 'center', lineHeight: 1.2 }}>IMG</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14.5px', fontWeight: 600, color: '#1F2A24', marginBottom: '3px' }}>{item.productName}</div>
                  <div style={{ fontSize: '12.5px', color: '#8A8273' }}>Qty {item.quantity}</div>
                </div>
                <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13.5px', fontWeight: 500, color: '#1F2A24' }}>{formatPrice(item.subtotal)}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11.5px', color: '#8A8273', marginTop: '3px' }}>{formatPrice(item.unitPrice)} each</div>
                </div>
              </div>
            ))}
            <div style={{ padding: '16px' }}>
              {order.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#8A8273', marginBottom: '9px' }}>
                  <span>Discount</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#2F6F4F' }}>−{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div style={{ height: '1px', background: '#F1EAD9', marginBottom: '14px' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '17px' }}>Total</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '18px', fontWeight: 500, color: '#2F6F4F' }}>{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping address */}
        <div style={{ padding: '24px 24px 0' }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8273', marginBottom: '10px' }}>Shipping address</div>
          <div style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', padding: '18px', display: 'flex', gap: '14px' }}>
            <div style={{ width: '36px', height: '36px', flex: '0 0 auto', borderRadius: '10px', background: '#EAF2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2F6F4F', fontSize: '16px' }}>⌖</div>
            <div style={{ fontSize: '14px', lineHeight: 1.55, color: '#1F2A24' }}>{order.shippingAddress}</div>
          </div>
        </div>

        {/* Payment */}
        <div style={{ padding: '24px 24px 0' }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8273', marginBottom: '10px' }}>Payment</div>
          <div style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', padding: '18px' }}>
            {payment ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <span style={{ fontSize: '13px', color: '#8A8273' }}>Status</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '6px 12px', borderRadius: '999px', fontSize: '12.5px', fontWeight: 600, background: statusStyle?.bg, color: statusStyle?.text }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: statusStyle?.text, display: 'inline-block' }}></span>
                    {getPaymentStatusLabel(payment.status)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontSize: '13px', color: '#8A8273' }}>Method</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '14px', fontWeight: 500, color: '#1F2A24' }}>
                    <span style={{ width: '30px', height: '20px', borderRadius: '4px', background: '#1F2A24', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'IBM Plex Mono', monospace", fontSize: '8px' }}>CARD</span>
                    {getPaymentMethodLabel(payment.method)}
                  </span>
                </div>
                {payment.transactionRef && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                    <span style={{ fontSize: '13px', color: '#8A8273' }}>Transaction ID</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#1F2A24' }}>{payment.transactionRef}</span>
                  </div>
                )}
                {isEligibleForRefund && (
                  <>
                    <div style={{ height: '1px', background: '#F1EAD9', marginBottom: '16px' }}></div>
                    <button
                      onClick={() => setShowRefundModal(true)}
                      style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #d98a6e', background: '#FBEEE8', color: '#B4502E', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Request Refund
                    </button>
                    <div style={{ textAlign: 'center', fontSize: '11.5px', color: '#A89F8B', marginTop: '9px' }}>Eligible for refund</div>
                  </>
                )}
              </>
            ) : (
              <p style={{ color: '#8A8273', fontSize: '13px', fontFamily: "'Inter', sans-serif" }}>No payment information available.</p>
            )}
          </div>
        </div>

        <div style={{ height: '32px' }}></div>
      </div>
    </div>
  );
}

export default OrderDetailPage;