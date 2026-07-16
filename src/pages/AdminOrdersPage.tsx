import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminTabs } from '../components/AdminTabs';
import { SkeletonTableRow } from '../components/Skeleton';
import {
  fetchAdminOrders,
  updateStoreOrderStatus,
  getOrderStatusStyle,
  STATUS_TRANSITIONS,
  type OrderStatus,
  type StoreOrderSummary,
} from '../api/adminOrdersApi';

const PAGE_SIZE = 10;

const GRID = '40px 1fr 1.4fr 1fr 1fr 0.7fr 1fr 0.9fr';

const labelMono = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '10.5px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: '#8A8273',
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function StatusBadge({ status }: { status: string }) {
  const s = getOrderStatusStyle(status);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 11px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, background: s.bg, color: s.text, whiteSpace: 'nowrap' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.text, display: 'inline-block' }} />
      {status}
    </span>
  );
}

const filters: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Processing', value: 'Processing' },
  { label: 'Shipped', value: 'Shipped' },
  { label: 'Delivered', value: 'Delivered' },
  { label: 'Cancelled', value: 'Cancelled' },
];

// One store's portion of an order — the level at which fulfillment status can
// actually be advanced. The dropdown only offers server-accepted transitions.
function StoreOrderRow({ so }: { so: StoreOrderSummary }) {
  const queryClient = useQueryClient();
  const nextStatuses = STATUS_TRANSITIONS[so.status] ?? [];

  const mutation = useMutation({
    mutationFn: (status: OrderStatus) => updateStoreOrderStatus(so.storeOrderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order status updated.');
    },
    onError: () => toast.error('Could not update this store order.'),
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.7fr 1fr 1.1fr', gap: '14px', alignItems: 'center', padding: '11px 22px 11px 62px', borderTop: '1px solid #F1EAD9', background: '#FCFAF5' }}>
      <div style={{ fontSize: '13px', color: '#1F2A24', fontWeight: 600 }}>{so.storeName}</div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12.5px', color: '#5c5648' }}>{formatPrice(so.subTotal)}</div>
      <div style={{ fontSize: '12.5px', color: '#8A8273' }}>{so.itemCount} item{so.itemCount === 1 ? '' : 's'}</div>
      <div><StatusBadge status={so.status} /></div>
      <div>
        {mutation.isPending ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '12.5px', color: '#8A8273' }}>
            <Loader2 size={13} className="animate-spin" /> Updating…
          </span>
        ) : nextStatuses.length > 0 ? (
          <select
            value=""
            onChange={(e) => e.target.value && mutation.mutate(e.target.value as OrderStatus)}
            style={{ fontFamily: "'Inter', sans-serif", fontSize: '12.5px', color: '#1F2A24', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '9px', padding: '7px 10px', cursor: 'pointer' }}
          >
            <option value="">Advance to…</option>
            {nextStatuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        ) : (
          <span style={{ fontSize: '12.5px', color: '#C2BBAA' }}>—</span>
        )}
      </div>
    </div>
  );
}

function AdminOrdersPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, status],
    queryFn: () => fetchAdminOrders({ page, pageSize: PAGE_SIZE, status: status || undefined }),
  });

  const orders = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="admin-enter" style={{ minHeight: '100vh', background: '#FBF7F0', fontFamily: "'Inter', sans-serif", color: '#1F2A24', padding: '40px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        <AdminTabs active="Orders" />
        <div style={{ flex: 1, minWidth: 0 }}>

        {/* Header */}
        <div>
          <div style={{ ...labelMono, marginBottom: '8px' }}>Shopit Admin</div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '34px', lineHeight: 1, margin: 0 }}>Orders</h1>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: '6px', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '11px', padding: '4px', marginBottom: '18px', width: 'fit-content' }}>
          {filters.map((f) => (
            <button
              key={f.label}
              onClick={() => { setStatus(f.value); setPage(1); }}
              style={{
                border: 'none',
                background: status === f.value ? '#1F2A24' : 'transparent',
                color: status === f.value ? '#fff' : '#8A8273',
                borderRadius: '8px',
                padding: '8px 14px',
                fontFamily: "'Inter', sans-serif",
                fontSize: '12.5px',
                fontWeight: status === f.value ? 600 : 500,
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: '14px', padding: '13px 22px', background: '#FBF7F0', borderBottom: '1px solid #E4DCC9', minWidth: '900px', ...labelMono }}>
            <div />
            <div>Order #</div>
            <div>Customer</div>
            <div>Date</div>
            <div>Status</div>
            <div>Items</div>
            <div>Payment</div>
            <div style={{ textAlign: 'right' }}>Total</div>
          </div>

          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <SkeletonTableRow key={i} gridTemplateColumns={GRID} cellCount={8} />
            ))
          ) : orders.length === 0 ? (
            <div style={{ padding: '56px', textAlign: 'center', color: '#8A8273', fontSize: '14px' }}>No orders found.</div>
          ) : (
            orders.map((order) => {
              const isOpen = expanded === order.id;
              return (
                <div key={order.id}>
                  <div
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                    style={{ display: 'grid', gridTemplateColumns: GRID, gap: '14px', alignItems: 'center', padding: '16px 22px', borderBottom: '1px solid #F1EAD9', cursor: 'pointer', minWidth: '900px' }}
                  >
                    <div style={{ color: '#8A8273' }}>
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#1F2A24' }}>#{order.id.toString().padStart(8, '0')}</div>
                    <div style={{ fontSize: '13px', color: '#1F2A24', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.customerEmail ?? '—'}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12.5px', color: '#5c5648' }}>{formatDate(order.createdAt)}</div>
                    <div><StatusBadge status={order.status} /></div>
                    <div style={{ fontSize: '13px', color: '#5c5648' }}>{order.itemCount}</div>
                    <div style={{ fontSize: '12.5px', color: '#8A8273' }}>{order.paymentStatus ?? '—'}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#1F2A24', textAlign: 'right' }}>{formatPrice(order.totalAmount)}</div>
                  </div>
                  {isOpen && (
                    order.storeOrders.length > 0 ? (
                      order.storeOrders.map((so) => <StoreOrderRow key={so.storeOrderId} so={so} />)
                    ) : (
                      <div style={{ padding: '12px 62px', borderTop: '1px solid #F1EAD9', background: '#FCFAF5', fontSize: '12.5px', color: '#8A8273' }}>No store orders.</div>
                    )
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {!isLoading && orders.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <div style={{ fontSize: '12.5px', color: '#8A8273' }}>Showing {orders.length} of {totalCount} orders</div>
            <div style={{ display: 'flex', gap: '9px' }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} style={{ fontFamily: "'Inter', sans-serif", fontSize: '12.5px', color: page <= 1 ? '#C2BBAA' : '#1F2A24', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '9px', padding: '8px 15px', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ fontFamily: "'Inter', sans-serif", fontSize: '12.5px', color: page >= totalPages ? '#C2BBAA' : '#1F2A24', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '9px', padding: '8px 15px', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>Next</button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default AdminOrdersPage;
