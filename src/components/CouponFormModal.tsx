import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createCoupon, type CouponDiscountType } from '../api/couponsApi';

// A store the caller is allowed to scope a coupon to.
export type CouponStoreOption = { id: number; name: string };

type Props = {
  onClose: () => void;
  // Stores the caller may target. Sellers pass their own stores; admins pass all
  // stores (and also get the "Platform-wide" option when allowPlatformWide).
  stores: CouponStoreOption[];
  // Admins may create a coupon with no store (platform-wide). Sellers may not —
  // the backend rejects a seller create with a null StoreId.
  allowPlatformWide: boolean;
};

const CODE_MAX = 50;

const labelMono = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '10.5px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: '#8A8273',
};

const fieldLabel = { ...labelMono, marginBottom: '7px' };

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontFamily: "'Inter', sans-serif",
  fontSize: '14px',
  color: '#1F2A24',
  background: '#fff',
  border: '1px solid #E4DCC9',
  borderRadius: '12px',
  padding: '11px 13px',
  boxSizing: 'border-box',
};

type FormState = {
  code: string;
  discountType: CouponDiscountType;
  discountValue: string;
  minimumOrderAmount: string;
  usageLimit: string;
  expiresAt: string;
  storeId: number | '';
};

function extractErrorMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { status?: number; data?: { message?: string } } };
  if (err?.response?.status === 409) {
    return 'A coupon with this code already exists.';
  }
  if (err?.response?.status === 403) {
    return 'You can only create coupons for your own store.';
  }
  return err?.response?.data?.message ?? fallback;
}

export function CouponFormModal({ onClose, stores, allowPlatformWide }: Props) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormState>({
    code: '',
    discountType: 'Percent',
    discountValue: '',
    minimumOrderAmount: '',
    usageLimit: '',
    expiresAt: '',
    // Sellers with a single store get it pre-selected; everyone else picks.
    storeId: !allowPlatformWide && stores.length === 1 ? stores[0].id : '',
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const createMutation = useMutation({
    mutationFn: () =>
      createCoupon({
        code: form.code.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minimumOrderAmount: form.minimumOrderAmount === '' ? null : Number(form.minimumOrderAmount),
        usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
        // datetime-local yields a local wall-clock string; send it as UTC ISO so
        // it matches the backend's "must be in the future" check (DateTime.UtcNow).
        expiresAt: form.expiresAt === '' ? null : new Date(form.expiresAt).toISOString(),
        storeId: form.storeId === '' ? null : Number(form.storeId),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon created.');
      onClose();
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Could not create the coupon.'));
    },
  });

  const handleCreate = () => {
    const code = form.code.trim();
    if (!code) {
      toast.error('Coupon code is required.');
      return;
    }
    const value = Number(form.discountValue);
    if (!form.discountValue || Number.isNaN(value) || value <= 0) {
      toast.error('Discount value must be greater than zero.');
      return;
    }
    if (form.discountType === 'Percent' && value > 100) {
      toast.error('A percentage discount cannot exceed 100.');
      return;
    }
    if (!allowPlatformWide && form.storeId === '') {
      toast.error('Please choose a store for this coupon.');
      return;
    }
    if (form.expiresAt !== '' && new Date(form.expiresAt).getTime() <= Date.now()) {
      toast.error('Expiry date must be in the future.');
      return;
    }
    createMutation.mutate();
  };

  const pending = createMutation.isPending;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(31,42,36,0.42)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', zIndex: 50 }}>
      <div style={{ width: '520px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '20px', boxShadow: '0 24px 60px rgba(31,42,36,0.20)', padding: '28px' }}>
        <div style={{ ...labelMono, marginBottom: '7px' }}>Coupon Details</div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '24px', margin: '0 0 22px', color: '#1F2A24' }}>
          New Coupon
        </h2>

        {/* Code */}
        <div style={{ marginBottom: '16px' }}>
          <div style={fieldLabel}>Code *</div>
          <input
            type="text"
            value={form.code}
            maxLength={CODE_MAX}
            onChange={(e) => set('code', e.target.value.toUpperCase())}
            placeholder="e.g. SUMMER25"
            style={inputStyle}
          />
        </div>

        {/* Discount type + value */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={fieldLabel}>Discount Type *</div>
            <select
              value={form.discountType}
              onChange={(e) => set('discountType', e.target.value as CouponDiscountType)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="Percent">Percentage (%)</option>
              <option value="Fixed">Fixed amount ($)</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={fieldLabel}>
              {form.discountType === 'Percent' ? 'Discount (%) *' : 'Discount ($) *'}
            </div>
            <input
              type="number"
              min={0}
              max={form.discountType === 'Percent' ? 100 : undefined}
              step="0.01"
              value={form.discountValue}
              onChange={(e) => set('discountValue', e.target.value)}
              placeholder={form.discountType === 'Percent' ? '25' : '10.00'}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Minimum order + usage limit */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={fieldLabel}>Minimum Order ($)</div>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.minimumOrderAmount}
              onChange={(e) => set('minimumOrderAmount', e.target.value)}
              placeholder="Optional"
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={fieldLabel}>Usage Limit</div>
            <input
              type="number"
              min={1}
              step="1"
              value={form.usageLimit}
              onChange={(e) => set('usageLimit', e.target.value)}
              placeholder="Unlimited"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Expiry date (end date). The backend has no start-date field — a coupon
            is active from creation until it expires or is deactivated. */}
        <div style={{ marginBottom: '16px' }}>
          <div style={fieldLabel}>Expiry Date</div>
          <input
            type="datetime-local"
            value={form.expiresAt}
            onChange={(e) => set('expiresAt', e.target.value)}
            style={{ ...inputStyle, cursor: 'text' }}
          />
          <div style={{ fontSize: '11.5px', color: '#C2BBAA', marginTop: '6px' }}>
            Leave empty for a coupon that never expires.
          </div>
        </div>

        {/* Store scope */}
        <div style={{ marginBottom: '22px' }}>
          <div style={fieldLabel}>Store {allowPlatformWide ? '' : '*'}</div>
          <select
            value={form.storeId}
            onChange={(e) => set('storeId', e.target.value === '' ? '' : Number(e.target.value))}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {allowPlatformWide && <option value="">Platform-wide (all stores)</option>}
            {!allowPlatformWide && <option value="" disabled>Select a store…</option>}
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #F1EAD9', paddingTop: '20px' }}>
          <button onClick={onClose} disabled={pending} style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#1F2A24', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '11px', padding: '11px 18px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleCreate} disabled={pending} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: '#fff', background: '#1F2A24', opacity: pending ? 0.7 : 1, border: '1px solid #1F2A24', borderRadius: '11px', padding: '11px 20px', cursor: pending ? 'wait' : 'pointer' }}>
            {pending && <Loader2 size={12} className="animate-spin" />}
            {pending ? 'Creating…' : 'Create Coupon'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CouponFormModal;
