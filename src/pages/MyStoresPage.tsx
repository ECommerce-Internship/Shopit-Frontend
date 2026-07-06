import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMyStores, createStore, getStoreStatusStyle } from '../api/SellerApi';

const inkText = { color: '#1F2A24', fontFamily: "'Inter', sans-serif" };
const mutedText = { color: '#8A8273', fontFamily: "'Inter', sans-serif" };
const labelMono = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: '#8A8273',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function CreateStoreModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const createMutation = useMutation({
    mutationFn: () => createStore(name, description || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-stores'] });
      toast.success('Store created! Pending approval.');
      onClose();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? 'Could not create store.');
    },
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(31,42,36,0.42)', backdropFilter: 'blur(2px)' }}>
      <div style={{ width: '420px', maxWidth: '100%', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '20px', padding: '28px' }}>
        <div style={{ ...labelMono, marginBottom: '6px' }}>New Store</div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '24px', color: '#1F2A24', margin: '0 0 20px' }}>Create a store</h2>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ ...mutedText, fontSize: '13px', display: 'block', marginBottom: '6px' }}>Store name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My New Store"
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E4DCC9', background: '#FBF7F0', ...inkText, fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ ...mutedText, fontSize: '13px', display: 'block', marginBottom: '6px' }}>Description <span style={{ color: '#A89F8B' }}>(optional)</span></label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell customers what you sell..."
            rows={3}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E4DCC9', background: '#FBF7F0', ...inkText, fontSize: '14px', boxSizing: 'border-box', resize: 'vertical', fontFamily: "'Inter', sans-serif" }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #E4DCC9', background: '#fff', ...inkText, fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!name.trim() || createMutation.isPending}
            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: name.trim() ? '#2F6F4F' : '#A8C4B4', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, cursor: name.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Create store
          </button>
        </div>
      </div>
    </div>
  );
}

function MyStoresPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: stores, isLoading } = useQuery({
    queryKey: ['my-stores'],
    queryFn: getMyStores,
  });

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FBF7F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={mutedText}>Loading stores…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FBF7F0', fontFamily: "'Inter', sans-serif", color: '#1F2A24', padding: '40px 24px' }}>
      {showCreateModal && <CreateStoreModal onClose={() => setShowCreateModal(false)} />}

      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <div style={{ ...labelMono, marginBottom: '6px' }}>Seller Dashboard</div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '32px', margin: 0 }}>My Stores</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', border: 'none', background: '#2F6F4F', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={16} />
            New store
          </button>
        </div>

        {/* Stores list */}
        {!stores || stores.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
            <p style={mutedText}>You don't have any stores yet.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{ marginTop: '16px', padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#2F6F4F', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
            >
              Create your first store
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stores.map((store) => {
              const statusStyle = getStoreStatusStyle(store.status);
              const isPending = store.status === 'Pending';
              const isSuspended = store.status === 'Suspended' || store.status === 'Rejected';

              return (
                <div
                  key={store.id}
                  style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', padding: '20px 24px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '18px', margin: 0 }}>{store.name}</h2>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, background: statusStyle.bg, color: statusStyle.text, fontFamily: "'IBM Plex Mono', monospace" }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusStyle.text, display: 'inline-block' }}></span>
                          {store.status}
                        </span>
                      </div>
                      {store.description && (
                        <p style={{ ...mutedText, fontSize: '13px', margin: '0 0 8px' }}>{store.description}</p>
                      )}
                      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#A89F8B', margin: 0 }}>
                        Created {formatDate(store.createdAt)} · /{store.slug}
                      </p>
                    </div>
                  </div>

                  {isPending && (
                    <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '10px', background: '#FBF3DE', border: '1px solid #ecd9a3', color: '#9A7B16', fontSize: '13px' }}>
                      Your store is pending approval by the platform admin. Selling actions are disabled until approved.
                    </div>
                  )}

                  {isSuspended && (
                    <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '10px', background: '#F3E1DC', border: '1px solid #e9c8b8', color: '#B14A2D', fontSize: '13px' }}>
                      This store has been {store.status.toLowerCase()}. Please contact support.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyStoresPage;