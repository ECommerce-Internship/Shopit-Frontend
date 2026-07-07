import { Link } from 'react-router-dom';
import { AdminTabs } from '../components/AdminTabs';

const labelMono = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '10.5px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: '#8A8273',
};

type AdminSection = {
  label: string;
  description: string;
  to: string;
};

const sections: AdminSection[] = [
  {
    label: 'Dashboard',
    description: 'KPIs, revenue trends, and top-selling products at a glance.',
    to: '/admin/dashboard',
  },
  {
    label: 'Orders',
    description: 'Track orders and advance fulfillment status per store.',
    to: '/admin/orders',
  },
  {
    label: 'Inventory',
    description: 'Monitor stock levels and set low-stock thresholds.',
    to: '/admin/inventory',
  },
  {
    label: 'Products',
    description: 'Add, edit, import and manage the product catalog.',
    to: '/admin/products',
  },
  {
    label: 'Payments',
    description: 'Review transactions and process refunds.',
    to: '/admin/payments',
  },
  {
    label: 'Reviews',
    description: 'Moderate customer reviews across the store.',
    to: '/admin/reviews',
  },
  {
    label: 'Categories',
    description: 'Organize the catalog with categories and subcategories.',
    to: '/admin/categories',
  },
];

function Admin() {
  return (
    <div className="admin-enter" style={{ minHeight: '100vh', background: '#FBF7F0', fontFamily: "'Inter', sans-serif", color: '#1F2A24', padding: '40px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        <AdminTabs active="Overview" />
        <div style={{ flex: 1, minWidth: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '24px', marginBottom: '26px' }}>
          <div>
            <div style={{ ...labelMono, marginBottom: '9px' }}>Shopit Admin</div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '34px', margin: 0, lineHeight: 1 }}>Overview</h1>
            <p style={{ fontSize: '14px', color: '#8A8273', margin: '10px 0 0' }}>Manage your store from a single place.</p>
          </div>
        </div>

        {/* Section cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '18px' }}>
          {sections.map((section, i) => (
            <Link
              key={section.label}
              to={section.to}
              className="admin-card-enter"
              style={{
                display: 'block',
                textDecoration: 'none',
                background: '#fff',
                border: '1px solid #E4DCC9',
                borderRadius: '16px',
                padding: '24px',
                animationDelay: `${i * 60}ms`,
              }}
            >
              <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '20px', margin: '0 0 8px', color: '#1F2A24' }}>{section.label}</h2>
              <p style={{ fontSize: '13.5px', lineHeight: 1.5, color: '#8A8273', margin: '0 0 16px' }}>{section.description}</p>
              <span style={{ ...labelMono, color: '#2F6F4F' }}>Manage →</span>
            </Link>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;
