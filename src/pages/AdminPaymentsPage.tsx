import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminTabs } from '../components/AdminTabs';
import {
  getAllPayments,
  refundPayment,
  getPaymentStatusLabel,
  getPaymentStatusStyle,
  type Payment,
} from '../api/paymentApi';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function RefundModal({ payment, onConfirm, onCancel, isPending }: {
  payment: Payment;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(31,42,36,0.42)', backdropFilter: 'blur(2px)' }}>
      <div style={{ position: 'relative', width: '400px', maxWidth: '100%', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '20px', boxShadow: '0 24px 60px rgba(31,42,36,0.20)', padding: '28px', textAlign: 'center' }}>
        <div style={{ width: '54px', height: '54px', margin: '0 auto 18px', borderRadius: '50%', background: '#FBEEE8', border: '1px solid #e9c8b8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B14A2D', fontSize: '24px' }}>↺</div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8273', marginBottom: '10px' }}>Refund Request</div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '26px', lineHeight: 1.1, margin: '0 0 12px', color: '#1F2A24' }}>Confirm Refund</h2>
        <p style={{ fontSize: '14.5px', lineHeight: 1.6, color: '#5c5648', margin: '0 auto 26px', maxWidth: '300px' }}>
          Are you sure you want to refund{' '}
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#1F2A24' }}>{formatPrice(payment.amount)}</span>{' '}
          for order <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#1F2A24' }}>#{payment.orderId}</span>? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onCancel} disabled={isPending} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #E4DCC9', background: '#fff', color: '#1F2A24', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} disabled={isPending} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #B14A2D', background: '#B14A2D', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Confirm Refund
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminPaymentsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<number>(-1);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', statusFilter],
    queryFn: () => getAllPayments(statusFilter === -1 ? undefined : statusFilter),
  });

  const refundMutation = useMutation({
    mutationFn: (paymentId: number) => refundPayment(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      setSelectedPayment(null);
      toast.success('Refund processed successfully.');
    },
    onError: () => {
      toast.error('Could not process refund. Please try again.');
    },
  });

  const payments = data?.items ?? [];

  const filterButtons = [
    { label: 'All', value: -1 },
    { label: 'Pending', value: 0 },
    { label: 'Paid', value: 1 },
    { label: 'Failed', value: 2 },
    { label: 'Refunded', value: 3 },
  ];

  return (
    <div className="admin-enter" style={{ minHeight: '100vh', background: '#FBF7F0', fontFamily: "'Inter', sans-serif", color: '#1F2A24', padding: '40px' }}>
      {selectedPayment && (
        <RefundModal
          payment={selectedPayment}
          onConfirm={() => refundMutation.mutate(selectedPayment.id)}
          onCancel={() => setSelectedPayment(null)}
          isPending={refundMutation.isPending}
        />
      )}

      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        <AdminTabs active="Payments" />
        <div style={{ flex: 1, minWidth: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px', marginBottom: '8px' }}>
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8273', marginBottom: '8px' }}>Shopit Admin</div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '34px', lineHeight: 1, margin: 0 }}>Payments</h1>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', margin: '0 0 18px' }}>
          <div style={{ display: 'flex', gap: '6px', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '11px', padding: '4px' }}>
            {filterButtons.map((btn) => (
              <button
                key={btn.label}
                onClick={() => { setStatusFilter(btn.value) }}
                style={{
                  border: 'none',
                  background: statusFilter === btn.value ? '#1F2A24' : 'transparent',
                  color: statusFilter === btn.value ? '#fff' : '#8A8273',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '12.5px',
                  fontWeight: statusFilter === btn.value ? 600 : 500,
                  cursor: 'pointer',
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', overflow: 'hidden' }}>
          {/* Head row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr 1fr 1fr 0.9fr', gap: '16px', padding: '14px 22px', background: '#FBF7F0', borderBottom: '1px solid #E4DCC9', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10.5px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8273' }}>
            <div>Order ID</div>
            <div>Amount</div>
            <div>Status</div>
            <div>Date</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
              <Loader2 size={24} className="animate-spin" color="#8A8273" />
            </div>
          ) : payments.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
              <p style={{ color: '#8A8273', fontFamily: "'Inter', sans-serif" }}>No payments found.</p>
            </div>
          ) : (
            payments.map((payment) => {
              const statusStyle = getPaymentStatusStyle(payment.status);
              return (
                <div key={payment.id} style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr 1fr 1fr 0.9fr', gap: '16px', alignItems: 'center', padding: '16px 22px', borderBottom: '1px solid #F1EAD9' }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#1F2A24' }}>#{payment.orderId.toString().padStart(8, '0')}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13.5px', color: '#1F2A24' }}>{formatPrice(payment.amount)}</div>
                  <div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 11px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, background: statusStyle.bg, color: statusStyle.text }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusStyle.text, display: 'inline-block' }}></span>
                      {getPaymentStatusLabel(payment.status)}
                    </span>
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12.5px', color: '#5c5648' }}>{payment.paidAt ? formatDate(payment.paidAt) : '—'}</div>
                  <div style={{ textAlign: 'right' }}>
                    {payment.status === 1 ? (
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        style={{ border: '1px solid #d98a6e', background: '#FBEEE8', color: '#B14A2D', borderRadius: '9px', padding: '8px 14px', fontFamily: "'Inter', sans-serif", fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Refund
                      </button>
                    ) : (
                      <span style={{ fontSize: '12.5px', color: '#C2BBAA' }}>—</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPaymentsPage;