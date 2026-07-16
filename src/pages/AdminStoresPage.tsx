import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminTabs } from '../components/AdminTabs';
import { SkeletonTableRow } from '../components/Skeleton';
import {
  fetchPendingStores,
  fetchAllStores,
  approveStore,
  rejectStore,
  suspendStore,
} from '../api/storesApi';
import type { AdminStore, StoreStatus } from '../types/store';

const labelMono = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '10.5px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: '#8A8273',
};

const GRID = '1.4fr 1.1fr 1fr 0.9fr 0.9fr 1fr';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function getStoreStatusStyle(status: string): { bg: string; text: string } {
  switch (status) {
    case 'Pending': return { bg: '#F6EAD2', text: '#A87420' };
    case 'Approved': return { bg: '#E3EEE6', text: '#2F6F4F' };
    case 'Suspended': return { bg: '#EEECE6', text: '#6B6455' };
    case 'Rejected': return { bg: '#FBEEE8', text: '#B14A2D' };
    default: return { bg: '#F0ECE2', text: '#8A8273' };
  }
}

function StatusBadge({ status }: { status: string }) {
  const s = getStoreStatusStyle(status);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 11px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, background: s.bg, color: s.text, whiteSpace: 'nowrap' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.text, display: 'inline-block' }} />
      {status}
    </span>
  );
}

// The three moderation transitions, each with its own confirm-dialog copy and accent.
type StoreAction = 'approve' | 'reject' | 'suspend';

const ACTION_COPY: Record<StoreAction, { verb: string; title: (name: string) => string; body: string; accent: string; toast: string }> = {
  approve: {
    verb: 'Approve',
    title: (name) => `Approve “${name}”?`,
    body: 'The store becomes visible and its products return to public browsing.',
    accent: '#2F6F4F',
    toast: 'Store approved.',
  },
  reject: {
    verb: 'Reject',
    title: (name) => `Reject “${name}”?`,
    body: 'The store stays hidden from shoppers. This applies to pending stores only.',
    accent: '#B14A2D',
    toast: 'Store rejected.',
  },
  suspend: {
    verb: 'Suspend',
    title: (name) => `Suspend “${name}”?`,
    body: "The store is hidden and its products disappear from public browsing until re-approved.",
    accent: '#B14A2D',
    toast: 'Store suspended.',
  },
};

const ACTION_FN: Record<StoreAction, (id: number) => Promise<void>> = {
  approve: approveStore,
  reject: rejectStore,
  suspend: suspendStore,
};

type PendingAction = { store: AdminStore; action: StoreAction };

function ConfirmModal({ pending, onConfirm, onCancel, isPending }: {
  pending: PendingAction;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const copy = ACTION_COPY[pending.action];
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(31,42,36,0.42)', backdropFilter: 'blur(2px)' }}>
      <div style={{ width: '420px', maxWidth: '100%', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '20px', boxShadow: '0 24px 60px rgba(31,42,36,0.20)', padding: '28px', textAlign: 'center' }}>
        <div style={{ ...labelMono, fontSize: '11px', letterSpacing: '0.12em', marginBottom: '10px' }}>{copy.verb} Store</div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '25px', lineHeight: 1.15, margin: '0 0 12px', color: '#1F2A24' }}>{copy.title(pending.store.name)}</h2>
        <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#5c5648', margin: '0 auto 26px', maxWidth: '320px' }}>{copy.body}</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onCancel} disabled={isPending} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #E4DCC9', background: '#fff', color: '#1F2A24', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} disabled={isPending} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: `1px solid ${copy.accent}`, background: copy.accent, color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {copy.verb}
          </button>
        </div>
      </div>
    </div>
  );
}

// Small pill button used for the inline row/queue actions.
function ActionButton({ label, tone, icon, onClick }: {
  label: string;
  tone: 'approve' | 'reject';
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  const styles = tone === 'approve'
    ? { border: '1px solid #a9cbb5', background: '#E3EEE6', color: '#2F6F4F' }
    : { border: '1px solid #d98a6e', background: '#FBEEE8', color: '#B14A2D' };
  return (
    <button
      onClick={onClick}
      style={{ ...styles, borderRadius: '9px', padding: '8px 14px', fontFamily: "'Inter', sans-serif", fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
    >
      {icon}{label}
    </button>
  );
}

const filters: { label: string; value: StoreStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Suspended', value: 'Suspended' },
  { label: 'Rejected', value: 'Rejected' },
];

function AdminStoresPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StoreStatus | ''>('');
  const [pending, setPending] = useState<PendingAction | null>(null);

  const pendingQuery = useQuery({
    queryKey: ['admin-stores-pending'],
    queryFn: fetchPendingStores,
  });

  const allQuery = useQuery({
    queryKey: ['admin-stores', statusFilter],
    queryFn: () => fetchAllStores(statusFilter || undefined),
  });

  const mutation = useMutation({
    mutationFn: ({ store, action }: PendingAction) => ACTION_FN[action](store.id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-stores-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
      setPending(null);
      toast.success(ACTION_COPY[variables.action].toast);
    },
    onError: () => toast.error('Could not update this store.'),
  });

  const pendingStores = pendingQuery.data ?? [];
  const allStores = allQuery.data ?? [];

  // Which transitions are offered for a store in the all-stores table.
  function rowActions(store: AdminStore): { label: string; action: StoreAction; tone: 'approve' | 'reject' }[] {
    switch (store.status) {
      case 'Pending':
        return [
          { label: 'Approve', action: 'approve', tone: 'approve' },
          { label: 'Reject', action: 'reject', tone: 'reject' },
        ];
      case 'Approved':
        return [{ label: 'Suspend', action: 'suspend', tone: 'reject' }];
      case 'Suspended':
        return [{ label: 'Re-approve', action: 'approve', tone: 'approve' }];
      default:
        return [];
    }
  }

  return (
    <div className="admin-enter" style={{ minHeight: '100vh', background: '#FBF7F0', fontFamily: "'Inter', sans-serif", color: '#1F2A24', padding: '40px' }}>
      {pending && (
        <ConfirmModal
          pending={pending}
          onConfirm={() => mutation.mutate(pending)}
          onCancel={() => setPending(null)}
          isPending={mutation.isPending}
        />
      )}

      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        <AdminTabs active="Stores" />
        <div style={{ flex: 1, minWidth: 0 }}>

        {/* Header */}
        <div>
          <div style={{ ...labelMono, marginBottom: '8px' }}>Shopit Admin</div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '34px', lineHeight: 1, margin: 0 }}>Stores</h1>
        </div>

        {/* Pending approval queue */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '14px' }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '20px', margin: 0 }}>Pending approval</h2>
            <span style={{ ...labelMono }}>{pendingStores.length} awaiting</span>
          </div>

          {pendingQuery.isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px' }}>
              <Loader2 size={24} className="animate-spin" color="#2F6F4F" />
            </div>
          ) : pendingStores.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#8A8273', fontSize: '14px', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px' }}>
              No stores awaiting approval.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {pendingStores.map((store) => (
                <div key={store.id} style={{ display: 'flex', alignItems: 'center', gap: '18px', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '14px', padding: '18px 22px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: '#1F2A24' }}>{store.name}</span>
                      <span style={{ ...labelMono }}>{store.slug}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#5c5648', marginBottom: store.description ? '6px' : 0 }}>
                      Owner: <span style={{ color: '#1F2A24' }}>{store.ownerName}</span> · {formatDate(store.createdAt)}
                    </div>
                    {store.description && (
                      <div style={{ fontSize: '13px', color: '#8A8273', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {store.description}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                    <ActionButton label="Approve" tone="approve" icon={<Check size={14} />} onClick={() => setPending({ store, action: 'approve' })} />
                    <ActionButton label="Reject" tone="reject" icon={<X size={14} />} onClick={() => setPending({ store, action: 'reject' })} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All stores */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '14px' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '20px', margin: 0 }}>All stores</h2>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: '6px', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '11px', padding: '4px', marginBottom: '18px', width: 'fit-content' }}>
          {filters.map((f) => (
            <button
              key={f.label}
              onClick={() => setStatusFilter(f.value)}
              style={{
                border: 'none',
                background: statusFilter === f.value ? '#1F2A24' : 'transparent',
                color: statusFilter === f.value ? '#fff' : '#8A8273',
                borderRadius: '8px',
                padding: '8px 14px',
                fontFamily: "'Inter', sans-serif",
                fontSize: '12.5px',
                fontWeight: statusFilter === f.value ? 600 : 500,
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: '14px', padding: '13px 22px', background: '#FBF7F0', borderBottom: '1px solid #E4DCC9', minWidth: '760px', ...labelMono }}>
            <div>Store</div>
            <div>Owner</div>
            <div>Slug</div>
            <div>Status</div>
            <div>Created</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>

          {allQuery.isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <SkeletonTableRow key={i} gridTemplateColumns={GRID} cellCount={6} />
            ))
          ) : allStores.length === 0 ? (
            <div style={{ padding: '56px', textAlign: 'center', color: '#8A8273', fontSize: '14px' }}>No stores found.</div>
          ) : (
            allStores.map((store) => {
              const actions = rowActions(store);
              return (
                <div key={store.id} style={{ display: 'grid', gridTemplateColumns: GRID, gap: '14px', alignItems: 'center', padding: '16px 22px', borderBottom: '1px solid #F1EAD9', minWidth: '760px' }}>
                  <div style={{ fontSize: '13.5px', color: '#1F2A24', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{store.name}</div>
                  <div style={{ fontSize: '13px', color: '#5c5648', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{store.ownerName}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12.5px', color: '#8A8273', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{store.slug}</div>
                  <div><StatusBadge status={store.status} /></div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12.5px', color: '#5c5648' }}>{formatDate(store.createdAt)}</div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {actions.length > 0 ? (
                      actions.map((a) => (
                        <ActionButton key={a.action} label={a.label} tone={a.tone} onClick={() => setPending({ store, action: a.action })} />
                      ))
                    ) : (
                      <span style={{ fontSize: '12.5px', color: '#C2BBAA' }}>—</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {!allQuery.isLoading && allStores.length > 0 && (
          <div style={{ marginTop: '16px', fontSize: '12.5px', color: '#8A8273' }}>Showing {allStores.length} store{allStores.length === 1 ? '' : 's'}</div>
        )}
        </div>
      </div>
    </div>
  );
}

export default AdminStoresPage;
