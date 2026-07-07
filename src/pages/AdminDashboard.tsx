import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, ShoppingBag, Users, AlertTriangle, Calendar, Percent, Loader2 } from 'lucide-react';
import {
  getAdminSummary,
  getAdminRevenue,
  getAdminTopProducts,
  getAdminOrdersByStatus,
} from '../api/Dashboardapi';

const labelMono = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: '#8A8273',
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

type KpiCardProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  sub?: string;
  link?: string;
};

function KpiCard({ label, value, icon, iconBg, sub, link }: KpiCardProps) {
  const content = (
    <div style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', padding: '22px 24px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={labelMono}>{label}</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '28px', color: '#1F2A24', lineHeight: 1.1, marginTop: '4px' }}>{value}</div>
        {sub && <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#8A8273', marginTop: '4px' }}>{sub}</div>}
      </div>
    </div>
  );

  if (link) return <Link to={link} style={{ textDecoration: 'none' }}>{content}</Link>;
  return content;
}

const PERIOD_OPTIONS = [
  { label: 'Daily', value: 'day' },
  { label: 'Weekly', value: 'week' },
  { label: 'Monthly', value: 'month' },
];

function AdminDashboard() {
  const [period, setPeriod] = useState('month');

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['admin-summary'],
    queryFn: getAdminSummary,
  });

  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: ['admin-revenue', period],
    queryFn: () => getAdminRevenue(period),
  });

  const { data: topProducts, isLoading: topLoading } = useQuery({
    queryKey: ['admin-top-products'],
    queryFn: getAdminTopProducts,
  });

  const { data: ordersByStatus, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders-by-status'],
    queryFn: getAdminOrdersByStatus,
  });

  return (
    <div style={{ minHeight: '100vh', background: '#FBF7F0', fontFamily: "'Inter', sans-serif", color: '#1F2A24', padding: '48px 40px 80px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '1080px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={labelMono}>Shopit Admin</div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '40px', margin: '8px 0 0' }}>Dashboard</h1>
        </div>

        {/* KPI cards */}
        {summaryLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 size={24} className="animate-spin" color="#8A8273" />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
            <KpiCard
              label="Total Revenue"
              value={formatPrice(summary?.totalRevenue ?? 0)}
              icon={<TrendingUp size={20} color="#2F6F4F" />}
              iconBg="#E3EEE6"
            />
            <KpiCard
              label="Total Commission"
              value={formatPrice(summary?.totalCommission ?? 0)}
              icon={<Percent size={20} color="#5B3F97" />}
              iconBg="#ECE5F8"
              sub="Platform earnings across all stores"
            />
            <KpiCard
              label="Total Orders"
              value={String(summary?.totalOrders ?? 0)}
              icon={<ShoppingBag size={20} color="#2B5A99" />}
              iconBg="#E1ECFB"
            />
            <KpiCard
              label="Total Customers"
              value={String(summary?.totalCustomers ?? 0)}
              icon={<Users size={20} color="#2F6F4F" />}
              iconBg="#E3EEE6"
            />
            <KpiCard
              label="Today's New Orders"
              value={String(summary?.todaysNewOrders ?? 0)}
              icon={<Calendar size={20} color="#A87420" />}
              iconBg="#F6EAD2"
            />
            <KpiCard
              label="Low Stock Items"
              value={String(summary?.lowStockCount ?? 0)}
              icon={<AlertTriangle size={20} color="#B14A2D" />}
              iconBg="#F3E1DC"
              sub="Click to view inventory"
              link="/admin/inventory"
            />
          </div>
        )}

        {/* Revenue chart */}
        <div style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '20px', margin: 0 }}>Revenue</h2>
            <div style={{ display: 'flex', gap: '6px' }}>
              {PERIOD_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  style={{ padding: '6px 12px', borderRadius: '8px', border: `1px solid ${period === opt.value ? '#2F6F4F' : '#E4DCC9'}`, background: period === opt.value ? '#2F6F4F' : '#fff', color: period === opt.value ? '#fff' : '#8A8273', fontFamily: "'Inter', sans-serif", fontSize: '12px', cursor: 'pointer' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {revenueLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Loader2 size={20} className="animate-spin" color="#8A8273" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={revenue ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EADC" />
                <XAxis dataKey="period" tick={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fill: '#8A8273' }} />
                <YAxis tick={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fill: '#8A8273' }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: unknown) => formatPrice(v as number)} />
                <Line type="monotone" dataKey="revenue" stroke="#2F6F4F" strokeWidth={2.5} dot={{ fill: '#2F6F4F', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders by status + Top products */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '24px' }}>

          {/* Orders by status bar chart */}
          <div style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '20px', margin: '0 0 20px' }}>Orders by Status</h2>
            {ordersLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Loader2 size={20} className="animate-spin" color="#8A8273" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ordersByStatus ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EADC" horizontal={false} />
                  <XAxis type="number" tick={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fill: '#8A8273' }} />
                  <YAxis type="category" dataKey="status" tick={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fill: '#8A8273' }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2F6F4F" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top products table */}
          <div style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E4DCC9' }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '20px', margin: 0 }}>Top Products</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '0.4fr 2fr 1fr 1fr', gap: '12px', padding: '10px 20px', background: '#FBF7F0', borderBottom: '1px solid #E4DCC9', ...labelMono }}>
              <div>#</div><div>Product</div><div style={{ textAlign: 'right' }}>Units</div><div style={{ textAlign: 'right' }}>Revenue</div>
            </div>
            {topLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
                <Loader2 size={20} className="animate-spin" color="#8A8273" />
              </div>
            ) : !topProducts || topProducts.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#8A8273' }}>No data yet.</div>
            ) : (
              topProducts.slice(0, 10).map((p, i) => (
                <div key={p.productId} style={{ display: 'grid', gridTemplateColumns: '0.4fr 2fr 1fr 1fr', gap: '12px', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #F1EAD9' }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#8A8273' }}>{i + 1}</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 500, color: '#1F2A24' }}>{p.productName}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12.5px', textAlign: 'right' }}>{p.unitsSold}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12.5px', textAlign: 'right', color: '#2F6F4F', fontWeight: 500 }}>{formatPrice(p.revenue)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;