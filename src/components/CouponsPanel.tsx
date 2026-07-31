import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, TicketPercent } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchCoupons, deactivateCoupon, type Coupon } from '../api/couponsApi';
import { CouponFormModal, type CouponStoreOption } from './CouponFormModal';

const labelMono = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '10.5px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: '#8A8273',
};

const GRID = 'minmax(120px, 1.4fr) 1fr 1.1fr 0.9fr 1.2fr 130px';

type Props = {
  // Stores the caller may scope a coupon to.
  stores: CouponStoreOption[];
  // Admins can create platform-wide coupons; sellers cannot.
  allowPlatformWide: boolean;
  // While the caller's stores are still loading, we hold the create button.
  storesLoading?: boolean;
  // Shown under the create button when a seller has no stores to scope to.
  noStoresHint?: string;
};

function formatDiscount(c: Coupon): string {
  return c.discountType === 'Percent' ? `${c.discountValue}%` : `$${c.discountValue.toFixed(2)}`;
}

function formatExpiry(iso: string | null): string {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function CouponsPanel({ stores, allowPlatformWide, storesLoading, noStoresHint }: Props) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: fetchCoupons,
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => deactivateCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon deactivated.');
    },
    onError: () => toast.error('Could not deactivate the coupon.'),
  });

  // Sellers need a store before they can create; admins can always create
  // (platform-wide). Hold while stores are still loading.
  const canCreate = allowPlatformWide || stores.length > 0;

  const storeName = (id: number | null) =>
    id == null ? 'Platform-wide' : stores.find((s) => s.id === id)?.name ?? `Store #${id}`;

  return (
    <>
      {createOpen && (
        <CouponFormModal
          stores={stores}
          allowPlatformWide={allowPlatformWide}
          onClose={() => setCreateOpen(false)}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '18px' }}>
        <div style={{ textAlign: 'right' }}>
          <button
            onClick={() => setCreateOpen(true)}
            disabled={storesLoading || !canCreate}
            title={canCreate ? undefined : 'Create a store before adding coupons.'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600,
              color: '#fff', background: storesLoading || !canCreate ? '#A8C4B4' : '#1F2A24',
              border: '1px solid', borderColor: storesLoading || !canCreate ? '#A8C4B4' : '#1F2A24',
              borderRadius: '11px', padding: '11px 18px',
              cursor: storesLoading || !canCreate ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
            }}
          >
            <Plus size={16} />
            Create Coupon
          </button>
          {!canCreate && !storesLoading && noStoresHint && (
            <div style={{ fontSize: '11.5px', color: '#8A8273', marginTop: '7px' }}>{noStoresHint}</div>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', gap: '14px', background: '#FBF7F0', borderBottom: '1px solid #E4DCC9', padding: '13px 22px', minWidth: '760px' }}>
          <div style={labelMono}>Code</div>
          <div style={labelMono}>Discount</div>
          <div style={labelMono}>Store</div>
          <div style={labelMono}>Usage</div>
          <div style={labelMono}>Expires</div>
          <div style={{ ...labelMono, textAlign: 'right' }}>Actions</div>
        </div>

        {isLoading ? (
          <div style={{ padding: '48px 0', display: 'flex', justifyContent: 'center' }}>
            <Loader2 size={20} className="animate-spin" color="#8A8273" />
          </div>
        ) : coupons.length === 0 ? (
          <div style={{ padding: '56px 0', textAlign: 'center', color: '#8A8273', fontSize: '14px' }}>
            <TicketPercent size={26} color="#A89F8B" style={{ marginBottom: '10px' }} />
            <div>No coupons yet. Create your first one.</div>
          </div>
        ) : (
          coupons.map((c) => (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', gap: '14px', padding: '16px 22px', borderBottom: '1px solid #F1EAD9', minWidth: '760px' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', fontWeight: 600, color: '#1F2A24' }}>{c.code}</div>
              <div style={{ fontSize: '14px', color: '#1F2A24' }}>
                {formatDiscount(c)}
                {c.minimumOrderAmount != null && (
                  <span style={{ color: '#8A8273', fontSize: '12px' }}> · min ${c.minimumOrderAmount.toFixed(2)}</span>
                )}
              </div>
              <div style={{ fontSize: '13px', color: c.storeId == null ? '#8A8273' : '#5c5648' }}>{storeName(c.storeId)}</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#5c5648' }}>
                {c.usageCount}{c.usageLimit != null ? ` / ${c.usageLimit}` : ''}
              </div>
              <div style={{ fontSize: '13px', color: '#5c5648', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {formatExpiry(c.expiresAt)}
                {!c.isActive && (
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', background: '#F0ECE2', color: '#8A8273', padding: '2px 7px', borderRadius: '20px' }}>INACTIVE</span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {c.isActive ? (
                  <button
                    onClick={() => deactivateMutation.mutate(c.id)}
                    disabled={deactivateMutation.isPending}
                    style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 500, color: '#B14A2D', background: '#FBEEE8', border: '1px solid #d98a6e', borderRadius: '9px', padding: '7px 13px', cursor: 'pointer' }}
                  >
                    Deactivate
                  </button>
                ) : (
                  <span style={{ fontSize: '12px', color: '#C2BBAA' }}>—</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default CouponsPanel;
