import { useNavigate } from 'react-router-dom';

// Single source of truth for the admin nav strip. Every admin page renders this
// with its own `active` label so the tabs never drift out of sync.
const TABS: { label: string; to?: string }[] = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Orders', to: '/admin/orders' },
  { label: 'Inventory', to: '/admin/inventory' },
  { label: 'Payments', to: '/admin/payments' },
  { label: 'Reviews', to: '/admin/reviews' },
  { label: 'Products', to: '/admin/products' },
  { label: 'Categories', to: '/admin/categories' },
  { label: 'Stores', to: '/admin/stores' },
  { label: 'Coupons', to: '/admin/coupons' },
  { label: 'Settings' },
];

export function AdminTabs({ active }: { active: string }) {
  const navigate = useNavigate();

  return (
    <aside style={{ flexShrink: 0, width: '176px', position: 'sticky', top: '40px', alignSelf: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: '1px solid #E4DCC9' }}>
        {TABS.map((tab) => {
        const isActive = tab.label === active;
        return (
          <div
            key={tab.label}
            onClick={() => tab.to && navigate(tab.to)}
            style={{
              fontSize: '13.5px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#1F2A24' : '#8A8273',
              padding: '8px 14px',
              borderLeft: isActive ? '2px solid #2F6F4F' : '2px solid transparent',
              marginLeft: '-1px',
              cursor: tab.to ? 'pointer' : 'default',
              transition: 'color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease',
            }}
          >
            {tab.label}
          </div>
        );
        })}
      </div>
    </aside>
  );
}

export default AdminTabs;
