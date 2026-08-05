import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2, DollarSign, ShoppingBag, Users, AlertTriangle, Calendar, Percent,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import {
  fetchDashboardSummary, fetchRevenue, fetchOrdersByStatus, fetchTopProducts,
} from '../api/dashboardApi';

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

function formatCompact(n: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

type KpiCard = {
  label: string;
  value: string;
  icon: React.ReactNode;
  tint: string;
  onClick?: () => void;
};

function Card({ card }: { card: KpiCard }) {
  return (
    <div
      onClick={card.onClick}
      style={{
        background: '#fff',
        border: '1px solid #E4DCC9',
        borderRadius: '16px',
        padding: '20px',
        cursor: card.onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ ...labelMono }}>{card.label}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '10px', background: card.tint, color: '#1F2A24' }}>
          {card.icon}
        </div>
      </div>
      <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '28px', lineHeight: 1, color: '#1F2A24' }}>{card.value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', padding: '22px' }}>
      <div style={{ ...labelMono, marginBottom: '18px' }}>{title}</div>
      {children}
    </div>
  );
}

function AdminDashboardPage() {
  const navigate = useNavigate();

  const summaryQ = useQuery({ queryKey: ['dashboard-summary'], queryFn: fetchDashboardSummary });
  const revenueQ = useQuery({ queryKey: ['dashboard-revenue'], queryFn: () => fetchRevenue('monthly') });
  const ordersQ = useQuery({ queryKey: ['dashboard-orders-by-status'], queryFn: fetchOrdersByStatus });
  const topProductsQ = useQuery({ queryKey: ['dashboard-top-products'], queryFn: fetchTopProducts });

  const summary = summaryQ.data;
  // Ticket asks for the last 6 months of revenue.
  const revenue = (revenueQ.data ?? []).slice(-6);
  const ordersByStatus = ordersQ.data ?? [];
  const topProducts = topProductsQ.data ?? [];

  const cards: KpiCard[] = summary
    ? [
        { label: 'Total Revenue', value: formatPrice(summary.totalRevenue), icon: <DollarSign size={17} />, tint: '#E3EEE6' },
        { label: 'Total Commission', value: formatPrice(summary.totalCommission), icon: <Percent size={17} />, tint: '#EAE6F5' },
        { label: 'Total Orders', value: formatCompact(summary.totalOrders), icon: <ShoppingBag size={17} />, tint: '#E6EDF5' },
        { label: 'Total Customers', value: formatCompact(summary.totalCustomers), icon: <Users size={17} />, tint: '#F6EAD2' },
        { label: 'Low Stock Items', value: String(summary.lowStockCount), icon: <AlertTriangle size={17} />, tint: '#FBEEE8', onClick: () => navigate('/admin/inventory') },
        { label: "Today's Orders", value: String(summary.todaysNewOrders), icon: <Calendar size={17} />, tint: '#E3EEE6' },
      ]
    : [];

  return (
    <div className="admin-enter" style={{ minHeight: '100vh', background: '#FBF7F0', fontFamily: "'Inter', sans-serif", color: '#1F2A24', padding: '40px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>

        {/* Header */}
        <div>
          <div style={{ ...labelMono, marginBottom: '8px' }}>Shopit Admin</div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '34px', lineHeight: 1, margin: 0 }}>Dashboard</h1>
        </div>

        {/* KPI cards */}
        {summaryQ.isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
            <Loader2 size={26} className="animate-spin" color="#2F6F4F" />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '14px', marginBottom: '18px' }}>
            {cards.map((c) => <Card key={c.label} card={c} />)}
          </div>
        )}

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '18px', marginBottom: '18px' }}>
          <Panel title="Revenue — last 6 months">
            {revenueQ.isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Loader2 size={22} className="animate-spin" color="#2F6F4F" /></div>
            ) : revenue.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#8A8273', fontSize: '13.5px' }}>No revenue data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={revenue} margin={{ top: 4, right: 12, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1EAD9" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#8A8273' }} stroke="#E4DCC9" />
                  <YAxis tick={{ fontSize: 11, fill: '#8A8273' }} stroke="#E4DCC9" tickFormatter={(v) => formatCompact(Number(v))} />
                  <Tooltip formatter={(v) => formatPrice(Number(v))} contentStyle={{ borderRadius: 12, border: '1px solid #E4DCC9', fontSize: 12 }} />
                  <Line type="monotone" dataKey="revenue" stroke="#2F6F4F" strokeWidth={2.5} dot={{ r: 3, fill: '#2F6F4F' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Panel>

          <Panel title="Orders by status">
            {ordersQ.isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Loader2 size={22} className="animate-spin" color="#2F6F4F" /></div>
            ) : ordersByStatus.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#8A8273', fontSize: '13.5px' }}>No order data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={ordersByStatus} margin={{ top: 4, right: 12, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1EAD9" />
                  <XAxis dataKey="status" tick={{ fontSize: 10.5, fill: '#8A8273' }} stroke="#E4DCC9" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#8A8273' }} stroke="#E4DCC9" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E4DCC9', fontSize: 12 }} />
                  <Bar dataKey="count" fill="#D97B3F" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>

        {/* Top products */}
        <Panel title="Top 10 products">
          {topProductsQ.isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 size={22} className="animate-spin" color="#2F6F4F" /></div>
          ) : topProducts.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#8A8273', fontSize: '13.5px' }}>No sales data yet.</div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 1fr 1fr', gap: '14px', padding: '0 4px 12px', borderBottom: '1px solid #F1EAD9', ...labelMono }}>
                <div>Rank</div>
                <div>Product</div>
                <div style={{ textAlign: 'right' }}>Units Sold</div>
                <div style={{ textAlign: 'right' }}>Revenue</div>
              </div>
              {topProducts.map((p, i) => (
                <div key={p.productId} style={{ display: 'grid', gridTemplateColumns: '48px 1fr 1fr 1fr', gap: '14px', alignItems: 'center', padding: '13px 4px', borderBottom: i === topProducts.length - 1 ? 'none' : '1px solid #F1EAD9' }}>
                  <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '16px', color: '#2F6F4F' }}>{i + 1}</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#1F2A24' }}>{p.productName}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#5c5648', textAlign: 'right' }}>{p.unitsSold}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#1F2A24', textAlign: 'right' }}>{formatPrice(p.revenue)}</div>
                </div>
              ))}
            </div>
          )}
        </Panel>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
