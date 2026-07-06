import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, PackageSearch } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchMyStoreOrders, updateStoreOrderStatus } from '../api/sellerOrdersApi';
import { getValidNextStatuses, getOrderStatusStyle } from '../types/sellerOrder';
import type { SellerStoreOrder, OrderStatus } from '../types/sellerOrder';
import { useSellerStores } from '../hooks/useSellerStores';

const inkText = { color: '#1F2A24', fontFamily: "'Inter', sans-serif" };
const mutedText = { color: '#8A8273', fontFamily: "'Inter', sans-serif" };
const labelMono = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: '#8A8273',
};

const FILTER_TABS: Array<OrderStatus | 'All'> = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

function extractErrorMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { status?: number; data?: { message?: string } } };
  if (err?.response?.status === 403) {
    return "You can only manage your own store's orders.";
  }
  if (err?.response?.status === 400) {
    return err?.response?.data?.message ?? 'That status change is not allowed from the current status.';
  }
  return err?.response?.data?.message ?? fallback;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function CancelConfirmModal({ storeOrder, onClose, onConfirm, isPending }: {
  storeOrder: SellerStoreOrder;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(31,42,36,0.42)', backdropFilter: 'blur(2px)' }}>
      <div style={{ width: '380px', maxWidth: '100%', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '20px', padding: '28px' }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '20px', color: '#1F2A24', margin: '0 0 10px' }}>Cancel this order?</h2>
        <p style={{ ...mutedText, fontSize: '14px', margin: '0 0 24px' }}>
          Order #{storeOrder.orderId} ({storeOrder.storeName}'s portion) will be cancelled and its {storeOrder.items.reduce((sum, i) => sum + i.quantity, 0)} item(s) restocked. This can't be undone.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #E4DCC9', background: '#fff', ...inkText, fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            Keep order
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#B14A2D', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Cancel order
          </button>
        </div>
      </div>
    </div>
  );
}

function StoreOrderCard({ storeOrder }: { storeOrder: SellerStoreOrder }) {
  const queryClient = useQueryClient();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const statusStyle = getOrderStatusStyle(storeOrder.status);
  const nextStatuses = getValidNextStatuses(storeOrder.status);
  const advanceStatuses = nextStatuses.filter((s) => s !== 'Cancelled');
  const canCancel = nextStatuses.includes('Cancelled');

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => updateStoreOrderStatus(storeOrder.storeOrderId, status),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['my-store-orders'] });
      setConfirmingCancel(false);
      toast.success(status === 'Cancelled' ? 'Order cancelled and restocked.' : `Order marked as ${status}.`);
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Could not update order status.'));
      setConfirmingCancel(false);
    },
  });

  return (
    <div style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '14px', padding: '20px 24px' }}>
      {confirmingCancel && (
        <CancelConfirmModal
          storeOrder={storeOrder}
          onClose={() => setConfirmingCancel(false)}
          onConfirm={() => statusMutation.mutate('Cancelled')}
          isPending={statusMutation.isPending}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '17px', margin: 0 }}>Order #{storeOrder.orderId}</h3>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, background: statusStyle.bg, color: statusStyle.text, fontFamily: "'IBM Plex Mono', monospace" }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusStyle.text, display: 'inline-block' }}></span>
              {storeOrder.status}
            </span>
          </div>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#A89F8B', margin: 0 }}>
            {storeOrder.storeName} · placed {formatDate(storeOrder.createdAt)}
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <p style={{ ...inkText, fontWeight: 600, fontSize: '15px', margin: '0 0 2px' }}>${storeOrder.subTotal.toFixed(2)}</p>
          <p style={{ ...mutedText, fontSize: '12px', margin: 0 }}>You earn ${storeOrder.sellerNetAmount.toFixed(2)}</p>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #F0ECE2', paddingTop: '12px', marginBottom: '14px' }}>
        {storeOrder.items.map((item) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', ...mutedText, marginBottom: '4px' }}>
            <span>{item.quantity} × {item.productName}</span>
            <span>${item.subtotal.toFixed(2)}</span>
          </div>
        ))}
        <p style={{ ...mutedText, fontSize: '12px', margin: '8px 0 0' }}>Ship to: {storeOrder.shippingAddress}</p>
      </div>

      {(advanceStatuses.length > 0 || canCancel) && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {advanceStatuses.map((status) => (
            <button
              key={status}
              onClick={() => statusMutation.mutate(status)}
              disabled={statusMutation.isPending}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#2F6F4F', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              {statusMutation.isPending && statusMutation.variables === status && <Loader2 size={12} className="animate-spin" />}
              Mark as {status}
            </button>
          ))}
          {canCancel && (
            <button
              onClick={() => setConfirmingCancel(true)}
              disabled={statusMutation.isPending}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e9c8b8', background: '#fff', color: '#B14A2D', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel order
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SellerOrdersPage() {
  const { hasApprovedStore, isLoading: storesLoading } = useSellerStores();
  const [filter, setFilter] = useState<OrderStatus | 'All'>('All');

  const { data: storeOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['my-store-orders'],
    queryFn: fetchMyStoreOrders,
    enabled: hasApprovedStore,
  });

  if (storesLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FBF7F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={mutedText}>Loading…</p>
      </div>
    );
  }

  if (!hasApprovedStore) {
    return (
      <div style={{ minHeight: '100vh', background: '#FBF7F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', padding: '48px', textAlign: 'center', maxWidth: '420px' }}>
          <p style={{ ...inkText, fontFamily: "'Fraunces', serif", fontSize: '20px', fontWeight: 600, margin: '0 0 10px' }}>No orders yet</p>
          <p style={{ ...mutedText, fontSize: '14px', margin: '0 0 20px' }}>
            You don't have an approved store yet, so you can't receive orders. Once a store is approved, orders placed against it will show up here.
          </p>
          <Link to="/seller/stores" style={{ display: 'inline-block', padding: '10px 20px', borderRadius: '10px', background: '#2F6F4F', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
            Check store status
          </Link>
        </div>
      </div>
    );
  }

  const orders = storeOrders ?? [];
  const filtered = filter === 'All' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div style={{ minHeight: '100vh', background: '#FBF7F0', fontFamily: "'Inter', sans-serif", color: '#1F2A24', padding: '40px 24px' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        <div style={{ ...labelMono, marginBottom: '6px' }}>Seller Dashboard</div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '32px', margin: '0 0 20px' }}>Orders</h1>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                padding: '6px 14px', borderRadius: '999px', border: '1px solid #E4DCC9', fontSize: '13px', fontFamily: "'Inter', sans-serif", fontWeight: 600, cursor: 'pointer',
                background: filter === tab ? '#2F6F4F' : '#fff',
                color: filter === tab ? '#fff' : '#1F2A24',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {ordersLoading ? (
          <p style={mutedText}>Loading orders…</p>
        ) : filtered.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
            <PackageSearch size={28} color="#A89F8B" style={{ marginBottom: '10px' }} />
            <p style={mutedText}>{filter === 'All' ? 'No orders yet.' : `No ${filter.toLowerCase()} orders.`}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filtered.map((storeOrder) => (
              <StoreOrderCard key={storeOrder.storeOrderId} storeOrder={storeOrder} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SellerOrdersPage;
