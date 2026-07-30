import { useQuery } from '@tanstack/react-query';
import { AdminTabs } from '../components/AdminTabs';
import { CouponsPanel } from '../components/CouponsPanel';
import { fetchStores } from '../api/storesApi';

const labelMono = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '10.5px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: '#8A8273',
};

// Admins may target any approved store or leave a coupon platform-wide (StoreId
// null). The approved-stores endpoint is the same list the admin product-create
// flow uses.
function AdminCouponsPage() {
  const { data: stores = [] } = useQuery({
    queryKey: ['admin-approved-stores'],
    queryFn: fetchStores,
  });

  const storeOptions = stores.map((s) => ({ id: s.id, name: s.name }));

  return (
    <div className="admin-enter" style={{ minHeight: '100vh', background: '#FBF7F0', fontFamily: "'Inter', sans-serif", color: '#1F2A24', padding: '40px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        <AdminTabs active="Coupons" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: '26px' }}>
            <div style={{ ...labelMono, marginBottom: '9px' }}>Shopit Admin</div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '34px', margin: 0, lineHeight: 1 }}>Coupons</h1>
          </div>

          <CouponsPanel stores={storeOptions} allowPlatformWide={true} />
        </div>
      </div>
    </div>
  );
}

export default AdminCouponsPage;
