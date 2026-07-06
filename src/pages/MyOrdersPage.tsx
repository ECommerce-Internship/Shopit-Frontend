import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMyOrders, type OrderSummary } from '../api/orderApi';
import { Skeleton } from '../components/Skeleton';

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
      padding: '5px 11px', borderRadius: '999px',
      fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600,
      letterSpacing: '0.01em',
      background: c.bg, color: c.fg,
      textDecoration: status === 'Cancelled' ? 'line-through' : 'none',
    }}>
      <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: c.dot }}></span>
      {status}
    </span>
  );
}

const FILTER_OPTIONS = ['All', 'Pending', 'Shipped', 'Delivered', 'Cancelled'];

function MyOrdersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('All');
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', page],
    queryFn: () => getMyOrders(page, 10),
  });

  const allOrders = data?.items ?? [];
  const orders = filter === 'All' ? allOrders : allOrders.filter(o => o.status === filter);
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.totalCount ?? 0;

  return (
    <div style={{ minHeight: '100vh', background: '#FBF7F0', fontFamily: "'Inter', sans-serif", color: '#1F2A24', padding: '56px 40px 80px', display: 'flex', justifyContent: 'center' }}>
      <style>{`
        @keyframes btnHoverIn { to { transform: translateY(-2px); } }
        .view-btn:hover { background: #2F6F4F !important; border-color: #2F6F4F !important; color: #FBF7F0 !important; transform: translateY(-2px); box-shadow: 0 8px 18px -8px rgba(47,111,79,0.7); }
        .view-btn:active { transform: translateY(0) scale(0.97) !important; }
        .shop-btn:hover { transform: translateY(-3px) !important; box-shadow: 0 14px 28px -10px rgba(47,111,79,0.75) !important; }
        .shop-btn:active { transform: translateY(-1px) scale(0.98) !important; }
        .filter-chip:hover { border-color: #2F6F4F !important; color: #2F6F4F !important; }
        .nav-btn:hover:not(:disabled) { border-color: #2F6F4F !important; color: #2F6F4F !important; }
        .order-row:hover { background: #FCFAF4 !important; }
      `}</style>

      <div style={{ width: '100%', maxWidth: '1080px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: '#2F6F4F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FBF7F0', fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '20px' }}>S</div>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8A8273' }}>Shopit / Account</span>
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#8A8273' }}>{totalCount} total orders</div>
        </div>

        <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '46px', lineHeight: 1.05, letterSpacing: '-0.01em', margin: '8px 0 4px' }}>My Orders</h1>
        <p style={{ fontSize: '15px', color: '#8A8273', margin: '0 0 32px', maxWidth: '520px' }}>
          Track deliveries, review past purchases, and manage returns — all in one place.
        </p>

        {isLoading ? (
          <div style={{ background: '#FFFFFF', border: '1px solid #E4DCC9', borderRadius: '16px', overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1.1fr 1.4fr 0.9fr 0.9fr', alignItems: 'center', gap: '16px', padding: '16px 28px', borderBottom: '1px solid #E4DCC9', background: '#FBF7F0', minWidth: '700px' }}>
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-3" style={{ width: '50%' }} />)}
            </div>
            {Array.from({ length: 5 }).map((_, row) => (
              <div key={row} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1.1fr 1.4fr 0.9fr 0.9fr', alignItems: 'center', gap: '16px', padding: '20px 28px', borderBottom: '1px solid #F0EADC', minWidth: '700px' }}>
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-4" style={{ width: i === 5 ? '70%' : '85%' }} />)}
              </div>
            ))}
          </div>
        ) : allOrders.length === 0 ? (
          /* Empty state */
          <div style={{ background: '#FFFFFF', border: '1px solid #E4DCC9', borderRadius: '16px', padding: '88px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '76px', height: '76px', borderRadius: '20px', border: '1px solid #E4DCC9', background: '#FBF7F0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#2F6F4F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 6h15l-1.5 9h-12z"></path>
                <path d="M6 6L5 2H2"></path>
                <circle cx="9" cy="20" r="1.4"></circle>
                <circle cx="18" cy="20" r="1.4"></circle>
              </svg>
            </div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '28px', margin: '0 0 8px' }}>You have no orders yet</h2>
            <p style={{ fontSize: '15px', color: '#8A8273', margin: '0 0 28px', maxWidth: '380px' }}>
              When you place your first order, it'll show up here so you can track it every step of the way.
            </p>
            <Link to="/products" className="shop-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 26px', borderRadius: '999px', border: 'none', background: '#2F6F4F', color: '#FBF7F0', fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s ease', textDecoration: 'none' }}>
              Shop Now <span style={{ fontSize: '16px' }}>→</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Filter chips */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
              {FILTER_OPTIONS.map((f) => (
                <button
                  key={f}
                  className="filter-chip"
                  onClick={() => { setFilter(f); setPage(1); }}
                  style={{
                    padding: '8px 15px', borderRadius: '999px',
                    border: `1px solid ${filter === f ? '#2F6F4F' : '#E4DCC9'}`,
                    background: filter === f ? '#2F6F4F' : '#FFFFFF',
                    color: filter === f ? '#FBF7F0' : '#1F2A24',
                    fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.16s ease',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Table */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E4DCC9', borderRadius: '16px', overflowX: 'auto' }}>
              {/* Head */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1.1fr 1.4fr 0.9fr 0.9fr', alignItems: 'center', gap: '16px', padding: '16px 28px', borderBottom: '1px solid #E4DCC9', background: '#FBF7F0', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8273', minWidth: '700px' }}>
                <div>Order #</div><div>Date</div><div>Status</div><div>Items</div>
                <div style={{ textAlign: 'right' }}>Total</div><div></div>
              </div>

              {orders.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#8A8273' }}>No orders match this filter.</div>
              ) : (
                orders.map((order: OrderSummary) => (
                  <div
                    key={order.id}
                    className="order-row"
                    style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1.1fr 1.4fr 0.9fr 0.9fr', alignItems: 'center', gap: '16px', padding: '20px 28px', borderBottom: '1px solid #F0EADC', background: hoveredRow === order.id ? '#FCFAF4' : '#FFFFFF', transition: 'background 0.15s ease', minWidth: '700px' }}
                    onMouseEnter={() => setHoveredRow(order.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', fontWeight: 500, color: '#1F2A24' }}>
                      #{order.id.toString().padStart(8, '0')}
                    </div>
                    <div style={{ fontSize: '14px', color: '#1F2A24' }}>{formatDate(order.createdAt)}</div>
                    <div><StatusBadge status={order.status} /></div>
                    <div style={{ fontSize: '14px', color: '#1F2A24', lineHeight: 1.35 }}>
                      <div>{order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}</div>
                      {order.storeOrders?.length > 0 && (
                        <div style={{ fontSize: '12px', color: '#8A8273', marginTop: '2px' }}>
                          {order.storeOrders.length} {order.storeOrders.length === 1 ? 'store' : 'stores'}
                        </div>
                      )}
                    </div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', fontWeight: 500, textAlign: 'right' }}>
                      {formatPrice(order.totalAmount)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="view-btn"
                        onClick={() => navigate(`/orders/${order.id}`)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '999px', border: '1px solid #E4DCC9', background: '#FFFFFF', color: '#1F2A24', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'transform 0.18s cubic-bezier(.34,1.56,.64,1), background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease', whiteSpace: 'nowrap' }}
                      >
                        View <span style={{ fontSize: '14px', lineHeight: 1 }}>→</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '22px', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '13px', color: '#8A8273' }}>
                Showing {Math.min((page - 1) * 10 + 1, orders.length)}–{Math.min(page * 10, orders.length)} of {orders.length}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button className="nav-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '8px 14px', borderRadius: '10px', border: `1px solid ${page === 1 ? '#EFE9DB' : '#E4DCC9'}`, background: page === 1 ? '#FBF7F0' : '#FFFFFF', color: page === 1 ? '#C9C1AF' : '#1F2A24', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, cursor: page === 1 ? 'not-allowed' : 'pointer', transition: 'all 0.18s ease' }}>
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ minWidth: '36px', padding: '8px 0', borderRadius: '10px', border: `1px solid ${p === page ? '#2F6F4F' : '#E4DCC9'}`, background: p === page ? '#2F6F4F' : '#FFFFFF', color: p === page ? '#FBF7F0' : '#1F2A24', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', cursor: 'pointer', transition: 'all 0.18s ease', textAlign: 'center' }}>
                    {p}
                  </button>
                ))}
                <button className="nav-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  style={{ padding: '8px 14px', borderRadius: '10px', border: `1px solid ${page >= totalPages ? '#EFE9DB' : '#E4DCC9'}`, background: page >= totalPages ? '#FBF7F0' : '#FFFFFF', color: page >= totalPages ? '#C9C1AF' : '#1F2A24', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, cursor: page >= totalPages ? 'not-allowed' : 'pointer', transition: 'all 0.18s ease' }}>
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MyOrdersPage;