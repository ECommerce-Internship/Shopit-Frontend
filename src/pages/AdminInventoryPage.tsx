import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil, Check, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminTabs } from '../components/AdminTabs';
import { fetchInventory, updateStock, updateThreshold, type InventoryItem } from '../api/inventoryApi';

const GRID = '1.6fr 1fr 1fr 1.1fr 1.1fr 1.1fr';

const labelMono = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '10.5px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: '#8A8273',
};

// A single cell that flips between a read-only number and an inline editor.
function EditableNumber({
  value,
  onSave,
  isPending,
}: {
  value: number;
  onSave: (next: number) => void;
  isPending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const start = () => { setDraft(String(value)); setEditing(true); };
  const commit = () => {
    const n = parseInt(draft, 10);
    if (Number.isNaN(n) || n < 0) { toast.error('Enter a valid non-negative number.'); return; }
    if (n === value) { setEditing(false); return; }
    onSave(n);
    setEditing(false);
  };

  if (isPending) {
    return <Loader2 size={15} className="animate-spin" color="#2F6F4F" />;
  }

  if (!editing) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#1F2A24' }}>{value}</span>
        <button onClick={start} title="Edit" style={{ display: 'inline-flex', border: 'none', background: 'transparent', color: '#8A8273', cursor: 'pointer', padding: 0 }}>
          <Pencil size={13} />
        </button>
      </span>
    );
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
      <input
        type="number"
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        style={{ width: '64px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#1F2A24', background: '#fff', border: '1px solid #2F6F4F', borderRadius: '8px', padding: '5px 7px', outline: 'none' }}
      />
      <button onClick={commit} title="Save" style={{ display: 'inline-flex', border: '1px solid #cfe2d5', background: '#E3EEE6', color: '#2F6F4F', borderRadius: '7px', padding: '4px', cursor: 'pointer' }}>
        <Check size={13} />
      </button>
      <button onClick={() => setEditing(false)} title="Cancel" style={{ display: 'inline-flex', border: '1px solid #E4DCC9', background: '#fff', color: '#8A8273', borderRadius: '7px', padding: '4px', cursor: 'pointer' }}>
        <X size={13} />
      </button>
    </span>
  );
}

function AdminInventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  // Track which row+field has a mutation in flight so we can show a spinner.
  const [pending, setPending] = useState<{ productId: number; field: 'stock' | 'threshold' } | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: fetchInventory,
  });

  const stockMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) => updateStock(productId, quantity),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory'] }); toast.success('Stock updated.'); },
    onError: () => toast.error('Could not update stock.'),
    onSettled: () => setPending(null),
  });

  const thresholdMutation = useMutation({
    mutationFn: ({ productId, threshold }: { productId: number; threshold: number }) => updateThreshold(productId, threshold),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory'] }); toast.success('Threshold updated.'); },
    onError: () => toast.error('Could not update threshold.'),
    onSettled: () => setPending(null),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.productName.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
  }, [items, search]);

  const lowStockCount = items.filter((i) => i.isLowStock).length;

  const isPending = (item: InventoryItem, field: 'stock' | 'threshold') =>
    pending?.productId === item.productId && pending?.field === field;

  return (
    <div className="admin-enter" style={{ minHeight: '100vh', background: '#FBF7F0', fontFamily: "'Inter', sans-serif", color: '#1F2A24', padding: '40px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        <AdminTabs active="Inventory" />
        <div style={{ flex: 1, minWidth: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '24px' }}>
          <div>
            <div style={{ ...labelMono, marginBottom: '8px' }}>Shopit Admin</div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '34px', lineHeight: 1, margin: 0 }}>Inventory</h1>
          </div>
          {lowStockCount > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#FBEEE8', border: '1px solid #e9c8b8', color: '#B14A2D', borderRadius: '11px', padding: '9px 14px', fontSize: '13px', fontWeight: 600 }}>
              <AlertTriangle size={15} />
              {lowStockCount} item{lowStockCount === 1 ? '' : 's'} low on stock
            </div>
          )}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '18px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A8273" strokeWidth="2" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="7"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name or SKU…"
            style={{ width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#1F2A24', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '12px', padding: '13px 16px 13px 42px' }}
          />
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: '14px', padding: '13px 22px', background: '#FBF7F0', borderBottom: '1px solid #E4DCC9', ...labelMono }}>
            <div>Product</div>
            <div>SKU</div>
            <div>Store</div>
            <div>Current Stock</div>
            <div>Threshold</div>
            <div>Status</div>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px' }}>
              <Loader2 size={26} className="animate-spin" color="#2F6F4F" />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '56px', textAlign: 'center', color: '#8A8273', fontSize: '14px' }}>No inventory records found.</div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.productId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: GRID,
                  gap: '14px',
                  alignItems: 'center',
                  padding: '16px 22px',
                  borderBottom: '1px solid #F1EAD9',
                  borderLeft: item.isLowStock ? '3px solid #B14A2D' : '3px solid transparent',
                  background: item.isLowStock ? '#FEFAF8' : '#fff',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#1F2A24' }}>{item.productName}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#8A8273' }}>{item.sku}</div>
                <div style={{ fontSize: '12.5px', color: '#5c5648' }}>{item.storeName}</div>
                <div>
                  <EditableNumber
                    value={item.quantity}
                    isPending={isPending(item, 'stock')}
                    onSave={(quantity) => { setPending({ productId: item.productId, field: 'stock' }); stockMutation.mutate({ productId: item.productId, quantity }); }}
                  />
                </div>
                <div>
                  <EditableNumber
                    value={item.lowStockThreshold}
                    isPending={isPending(item, 'threshold')}
                    onSave={(threshold) => { setPending({ productId: item.productId, field: 'threshold' }); thresholdMutation.mutate({ productId: item.productId, threshold }); }}
                  />
                </div>
                <div>
                  {item.isLowStock ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 11px', borderRadius: '999px', fontSize: '11.5px', fontWeight: 600, background: '#FBEEE8', color: '#B14A2D' }}>
                      <AlertTriangle size={12} />
                      Low Stock
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 11px', borderRadius: '999px', fontSize: '11.5px', fontWeight: 600, background: '#E3EEE6', color: '#2F6F4F' }}>
                      In Stock
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

export default AdminInventoryPage;
