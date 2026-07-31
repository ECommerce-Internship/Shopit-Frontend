import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMyStores } from '../api/SellerApi';
import { StoreApprovedModal } from '../components/StoreApprovedModal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import {
  fetchSellerSummary,
  fetchSellerRevenue,
  fetchSellerTopProducts,
} from '../api/dashboardApi';
import { ProductEngagementPanel } from '../components/ProductEngagementPanel';

function formatPrice(price: number): string {
  return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const labelMono: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  color: '#8A8273',
};

type KpiCardProps = {
  label: string;
  value: string;
  sub?: string;
  iconBg: string;
  icon: React.ReactNode;
};

function KpiCard({ label, value, sub, iconBg, icon }: KpiCardProps) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E4DCC9', borderRadius: '14px', padding: '22px 22px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div style={labelMono}>{label}</div>
        <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
      </div>
      <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '30px', letterSpacing: '-0.01em', color: '#1F2A24' }}>{value}</div>
      {sub && <div style={{ fontSize: '13px', color: '#8A8273', marginTop: '6px' }}>{sub}</div>}
    </div>
  );
}

const PERIOD_OPTIONS: { label: string; value: 'day' | 'week' | 'monthly' }[] = [
  { label: 'Today', value: 'day' },
  { label: 'This week', value: 'week' },
  { label: 'This month', value: 'monthly' },
];

function DollarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M12 3v18M16.5 7.5c0-1.9-2-3-4.5-3s-4.5 1.1-4.5 3c0 4 9 2.4 9 6.5 0 1.9-2 3-4.5 3s-4.5-1.1-4.5-3" fill="none" stroke="#2F6F4F" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M6 8h12l-1 12H7L6 8Z" fill="none" stroke="#2F6F4F" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="#2F6F4F" strokeWidth="1.8"/>
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M12 3 L22 20 L2 20 Z" fill="none" stroke="#A6821F" strokeWidth="1.8" strokeLinejoin="round"/>
      <line x1="12" y1="9.5" x2="12" y2="14.5" stroke="#A6821F" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="12" cy="17" r="0.9" fill="#A6821F"/>
    </svg>
  );
}

function NetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="#2B5A99" strokeWidth="1.8"/>
      <path d="M8 12h8M12 8v8" stroke="#2B5A99" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function SellerDashboard() {
 const [period, setPeriod] = useState<'day' | 'week' | 'monthly'>('day');

  const { data: stores } = useQuery({
    queryKey: ['my-stores'],
    queryFn: getMyStores,
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['seller-summary'],
    queryFn: fetchSellerSummary,
  });

  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: ['seller-revenue', period],
    queryFn: () => fetchSellerRevenue(period),
  });

  const { data: topProducts, isLoading: topLoading } = useQuery({
    queryKey: ['seller-top-products'],
    queryFn: fetchSellerTopProducts,
  });

  const activeStore = stores?.find(s => s.status === 'Approved') ?? stores?.[0];
  const isPending = !activeStore || activeStore.status !== 'Approved';
  const storeName = activeStore?.name ?? 'Your Store';

  // Add state to track if modal was shown (uses localStorage so it only pops once per store)
const [showApproved, setShowApproved] = useState(() => {
  if (!activeStore || activeStore.status !== 'Approved') return false;
  const key = `store-approved-seen-${activeStore.id}`;
  if (localStorage.getItem(key)) return false;
  localStorage.setItem(key, '1');
  return true;
});

  const statusBadge = isPending
    ? { label: 'Pending Approval', bg: '#FDF6DD', color: '#8A6D1B', border: '#E8D27A' }
    : { label: 'Active', bg: '#E7F0EA', color: '#2F6F4F', border: '#CFE3D6' };

  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div style={{ minHeight: '100vh', background: '#FBF7F0', fontFamily: "'Inter', sans-serif", color: '#1F2A24', padding: '48px 56px 72px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '40px', margin: '0 0 6px', letterSpacing: '-0.01em' }}>Seller Dashboard</h1>
          <div style={{ fontSize: '15px', color: '#8A8273', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link to="/seller/stores" style={{ color: '#8A8273' }}>{storeName}</Link>
            <span style={{ color: '#E4DCC9' }}>·</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: '20px', background: statusBadge.bg, color: statusBadge.color, border: `1px solid ${statusBadge.border}`, whiteSpace: 'nowrap' }}>
              {statusBadge.label}
            </span>
          </div>
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#8A8273' }}>{todayLabel}</div>
      </div>

      {/* Pending banner */}
      {isPending && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: '#FDF6DD', border: '1px solid #E8D27A', borderRadius: '10px', padding: '16px 20px', marginBottom: '28px' }}>
          <AlertIcon />
          <div>
            <div style={{ fontWeight: 600, fontSize: '15px', color: '#5C4A12', marginBottom: '2px' }}>Your store is pending approval</div>
            <div style={{ fontSize: '14px', color: '#7A6521' }}>Selling actions are disabled until an admin reviews your store.</div>
          </div>
        </div>
      )}

      {/* KPI cards */}
      {summaryLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Loader2 size={24} className="animate-spin" color="#8A8273" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
          <KpiCard
            label="Gross Sales"
            value={formatPrice(summary?.grossSales ?? 0)}
            sub={`${formatPrice(summary?.totalCommission ?? 0)} commission deducted`}
            iconBg="#E7F0EA"
            icon={<DollarIcon />}
          />
          <KpiCard
            label="Net Earnings"
            value={formatPrice(summary?.netEarnings ?? 0)}
            sub="After platform commission"
            iconBg="#E1ECFB"
            icon={<NetIcon />}
          />
          <KpiCard
            label="Total Orders"
            value={String(summary?.totalOrders ?? 0)}
            sub={`${summary?.todaysNewOrders ?? 0} new today`}
            iconBg="#E7F0EA"
            icon={<BagIcon />}
          />
          <KpiCard
            label="Low Stock Items"
            value={String(summary?.lowStockCount ?? 0)}
            sub="Restock recommended"
            iconBg="#FBF0D3"
            icon={<AlertIcon />}
          />
        </div>
      )}

      {/* Revenue chart */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E4DCC9', borderRadius: '14px', padding: '26px 28px 22px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '6px' }}>
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
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenue ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2F6F4F" stopOpacity={0.16} />
                  <stop offset="100%" stopColor="#2F6F4F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4DCC9" vertical={false} />
              <XAxis dataKey="period" tick={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fill: '#8A8273' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fill: '#8A8273' }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: unknown) => [formatPrice(v as number), 'Revenue']} labelStyle={{ fontFamily: "'Inter', sans-serif" }} contentStyle={{ borderRadius: '10px', border: '1px solid #E4DCC9' }} />
              <Line type="monotone" dataKey="revenue" stroke="#2F6F4F" strokeWidth={2.5} dot={{ fill: '#FFFFFF', stroke: '#2F6F4F', strokeWidth: 2.5, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top products */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E4DCC9', borderRadius: '14px', padding: '26px 28px 12px' }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '20px', margin: '0 0 18px' }}>Top Products</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 140px 160px', padding: '0 8px 12px', borderBottom: '1px solid #E4DCC9', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8A8273' }}>
          <div>Rank</div><div>Product</div><div style={{ textAlign: 'right' }}>Units Sold</div><div style={{ textAlign: 'right' }}>Revenue</div>
        </div>

        {topLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
            <Loader2 size={20} className="animate-spin" color="#8A8273" />
          </div>
        ) : !topProducts || topProducts.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#8A8273', fontSize: '14px' }}>No sales data yet.</div>
        ) : (
          topProducts.map((p, i) => (
            <div key={p.productId} style={{ display: 'grid', gridTemplateColumns: '56px 1fr 140px 160px', alignItems: 'center', padding: '14px 8px', borderBottom: '1px solid #EFE9DA' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', color: '#8A8273' }}>{i + 1}</div>
              <div style={{ fontSize: '15px', fontWeight: 500 }}>{p.productName}</div>
              <div style={{ textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px' }}>{p.unitsSold}</div>
              <div style={{ textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', fontWeight: 600, color: '#2F6F4F' }}>{formatPrice(p.revenue)}</div>
            </div>
          ))
        )}
      </div>
        {showApproved && activeStore && (
        <StoreApprovedModal
        storeName={activeStore.name}
        storeSlug={activeStore.slug}
        onDismiss={() => setShowApproved(false)}
  />
)}
      {/* Product engagement — clicks & time spent for this store's products */}
      <ProductEngagementPanel storeId={activeStore?.id} />
    </div>
  );
}

export default SellerDashboard;