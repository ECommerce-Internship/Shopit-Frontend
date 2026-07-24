import { useSellerStores } from '../hooks/useSellerStores';
import { CouponsPanel } from '../components/CouponsPanel';

const labelMono = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: '#8A8273',
};

// A seller manages coupons for the stores they own. Unlike products, the backend
// does NOT require an Approved store to create a coupon — only ownership — so we
// offer every store the seller has, not just approved ones.
function SellerCouponsPage() {
  const { stores, isLoading } = useSellerStores();
  const storeOptions = stores.map((s) => ({ id: s.id, name: s.name }));

  return (
    <div style={{ minHeight: '100vh', background: '#FBF7F0', fontFamily: "'Inter', sans-serif", color: '#1F2A24', padding: '40px 24px' }}>
      <div style={{ maxWidth: '920px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ ...labelMono, marginBottom: '6px' }}>Seller Dashboard</div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '32px', margin: 0 }}>Coupons</h1>
        </div>

        <CouponsPanel
          stores={storeOptions}
          allowPlatformWide={false}
          storesLoading={isLoading}
          noStoresHint="Create a store before adding coupons."
        />
      </div>
    </div>
  );
}

export default SellerCouponsPage;
