import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { fetchStorefront, fetchStorefrontProducts } from '../api/productsApi';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';


function getStatusStyle(status: string): { bg: string; border: string; color: string } {
  switch (status) {
    case 'Approved': return { bg: 'rgba(47,111,79,0.10)', border: 'rgba(47,111,79,0.25)', color: '#2F6F4F' };
    case 'Pending': return { bg: '#FBF3DE', border: '#ecd9a3', color: '#9A7B16' };
    case 'Suspended': return { bg: '#F0ECE2', border: '#dcd8cd', color: '#8A8273' };
    default: return { bg: '#F0ECE2', border: '#dcd8cd', color: '#8A8273' };
  }
}

function StorefrontPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: store, isLoading: storeLoading, isError: storeError } = useQuery({
    queryKey: ['store', slug],
    queryFn: () => fetchStorefront(slug!),
    enabled: !!slug,
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['store-products', slug],
    queryFn: () => fetchStorefrontProducts(slug!),
    enabled: !!slug && !!store,
  });

  if (storeLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FBF7F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#8A8273', fontFamily: "'Inter', sans-serif" }}>Loading store…</p>
      </div>
    );
  }

  if (storeError || !store) {
    return (
      <div style={{ minHeight: '100vh', background: '#FBF7F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <p style={{ color: '#B14A2D', fontFamily: "'Inter', sans-serif" }}>Store not found.</p>
        <Link to="/products" style={{ color: '#2F6F4F', fontFamily: "'Inter', sans-serif" }}>Back to Products</Link>
      </div>
    );
  }

  const products = productsData?.items ?? [];
  const statusStyle = getStatusStyle(store.status);
  const initial = store.name.charAt(0).toUpperCase();

  return (
    <div style={{ minHeight: '100vh', background: '#FBF7F0', color: '#1F2A24', fontFamily: "'Inter', sans-serif", padding: '48px 32px 80px' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <Link
            to="/products"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8A8273', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', textDecoration: 'none' }}
          >
            <ArrowLeft size={14} />
            stores
          </Link>
          <span style={{ color: '#8A8273', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}>/</span>
          <span style={{ color: '#1F2A24', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}>{slug}</span>
        </div>

        {/* Store header card */}
        <div style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', padding: '40px', marginBottom: '48px', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>

          {/* Store avatar */}
          <div style={{ flexShrink: 0, width: '96px', height: '96px', borderRadius: '16px', background: '#FBF7F0', border: '1px solid #E4DCC9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '40px', color: '#2F6F4F' }}>
            {initial}
          </div>

          {/* Store info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '44px', lineHeight: 1.05, letterSpacing: '-0.01em', margin: 0, color: '#1F2A24' }}>
                {store.name}
              </h1>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: statusStyle.bg, border: `1px solid ${statusStyle.border}`, color: statusStyle.color, padding: '6px 12px', borderRadius: '999px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', fontWeight: 500, letterSpacing: '0.02em' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: statusStyle.color }}></span>
                {store.status}
              </div>
            </div>

            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#8A8273', marginBottom: '18px' }}>
              @{store.slug}
            </div>

            {store.description && (
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', lineHeight: 1.6, color: '#1F2A24', maxWidth: '620px', margin: 0 }}>
                {store.description}
              </p>
            )}

            <div style={{ display: 'flex', gap: '24px', marginTop: '24px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '22px', color: '#1F2A24' }}>
                  {productsData?.totalCount ?? '—'}
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '0.04em', color: '#8A8273', textTransform: 'uppercase' }}>
                  Products
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products section */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '26px', margin: 0, color: '#1F2A24' }}>
            Products
          </h2>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#8A8273' }}>
            {productsData?.totalCount ?? 0} items
          </span>
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
            <p style={{ color: '#8A8273', fontFamily: "'Inter', sans-serif" }}>No products in this store yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StorefrontPage;