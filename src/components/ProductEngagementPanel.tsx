import { useQuery, useQueries } from '@tanstack/react-query';
import { Loader2, MousePointerClick, Clock } from 'lucide-react';
import { fetchMyProducts } from '../api/sellerProductsApi';
import { fetchClickStats, fetchTimeSpentStats } from '../api/productAnalyticsApi';

// Shows the interest signals (clicks + time spent) the seller's products are
// getting, scoped to one store. The backend only exposes per-product stats, so
// we fan out one clicks + one time-spent request per product and aggregate the
// store totals here.

const labelMono: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#8A8273',
};

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

export function ProductEngagementPanel({ storeId }: { storeId: number | undefined }) {
  const { data, isLoading: productsLoading } = useQuery({
    queryKey: ['engagement-products', storeId],
    queryFn: () => fetchMyProducts({ page: 1, pageSize: 50, storeId }),
    enabled: storeId !== undefined,
  });

  const products = data?.items ?? [];

  const clickResults = useQueries({
    queries: products.map((p) => ({
      queryKey: ['product-click-stats', p.id],
      queryFn: () => fetchClickStats(p.id),
    })),
  });

  const timeResults = useQueries({
    queries: products.map((p) => ({
      queryKey: ['product-time-stats', p.id],
      queryFn: () => fetchTimeSpentStats(p.id),
    })),
  });

  const statsLoading = clickResults.some((r) => r.isLoading) || timeResults.some((r) => r.isLoading);

  const rows = products.map((p, i) => ({
    productId: p.id,
    productName: p.name,
    totalClicks: clickResults[i]?.data?.totalClicks ?? 0,
    uniqueUsers: clickResults[i]?.data?.uniqueUsers ?? 0,
    averageDurationMs: timeResults[i]?.data?.averageDurationMs ?? 0,
    totalDurationMs: timeResults[i]?.data?.totalDurationMs ?? 0,
  }));

  // Most-viewed first so the seller sees their attention-grabbers up top.
  rows.sort((a, b) => b.totalClicks - a.totalClicks);

  const totalClicks = rows.reduce((sum, r) => sum + r.totalClicks, 0);
  const totalTimeMs = rows.reduce((sum, r) => sum + r.totalDurationMs, 0);

  const gridCols = '1fr 110px 130px 130px 130px';

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E4DCC9', borderRadius: '14px', padding: '26px 28px 12px', marginTop: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '20px', margin: 0 }}>Product Engagement</h2>
        <div style={{ display: 'flex', gap: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MousePointerClick size={16} color="#2F6F4F" />
            <div>
              <div style={{ ...labelMono, marginBottom: '1px' }}>Total Clicks</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '16px', fontWeight: 600, color: '#1F2A24' }}>{totalClicks}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="#2B5A99" />
            <div>
              <div style={{ ...labelMono, marginBottom: '1px' }}>Total Time Spent</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '16px', fontWeight: 600, color: '#1F2A24' }}>{formatDuration(totalTimeMs)}</div>
            </div>
          </div>
        </div>
      </div>
      <p style={{ fontSize: '13px', color: '#8A8273', margin: '0 0 18px' }}>How much attention your products are drawing in this store.</p>

      <div style={{ display: 'grid', gridTemplateColumns: gridCols, padding: '0 8px 12px', borderBottom: '1px solid #E4DCC9', ...labelMono }}>
        <div>Product</div>
        <div style={{ textAlign: 'right' }}>Clicks</div>
        <div style={{ textAlign: 'right' }}>Unique Visitors</div>
        <div style={{ textAlign: 'right' }}>Avg Time</div>
        <div style={{ textAlign: 'right' }}>Total Time</div>
      </div>

      {productsLoading || (statsLoading && rows.every((r) => r.totalClicks === 0)) ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
          <Loader2 size={20} className="animate-spin" color="#8A8273" />
        </div>
      ) : rows.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#8A8273', fontSize: '14px' }}>No products in this store yet.</div>
      ) : (
        rows.map((r) => (
          <div key={r.productId} style={{ display: 'grid', gridTemplateColumns: gridCols, alignItems: 'center', padding: '14px 8px', borderBottom: '1px solid #EFE9DA' }}>
            <div style={{ fontSize: '15px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '12px' }}>{r.productName}</div>
            <div style={{ textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', fontWeight: 600, color: '#2F6F4F' }}>{r.totalClicks}</div>
            <div style={{ textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', color: '#8A8273' }}>{r.uniqueUsers}</div>
            <div style={{ textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px' }}>{formatDuration(r.averageDurationMs)}</div>
            <div style={{ textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px' }}>{formatDuration(r.totalDurationMs)}</div>
          </div>
        ))
      )}
    </div>
  );
}
