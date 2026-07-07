import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Pencil, Trash2, PackageSearch, ImageOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchMyProducts } from '../api/sellerProductsApi';
import { deleteProduct } from '../api/productsApi';
import { updateStock, updateThreshold, fetchInventoryForProduct } from '../api/inventoryApi';
import { getStoreStatusStyle } from '../api/SellerApi';
import { useSellerStores } from '../hooks/useSellerStores';
import type { Product } from '../types/product';

const inkText = { color: '#1F2A24', fontFamily: "'Inter', sans-serif" };
const mutedText = { color: '#8A8273', fontFamily: "'Inter', sans-serif" };
const labelMono = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: '#8A8273',
};

function extractErrorMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { status?: number; data?: { message?: string } } };
  if (err?.response?.status === 403) {
    return "You can only manage products in your own store.";
  }
  return err?.response?.data?.message ?? fallback;
}

function InventoryModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(product.stockQuantity);
  const [threshold, setThreshold] = useState<number | null>(null);

  const { isLoading } = useQuery({
    queryKey: ['inventory', product.id],
    queryFn: async () => {
      const inventory = await fetchInventoryForProduct(product.id);
      setThreshold(inventory.lowStockThreshold);
      return inventory;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await updateStock(product.id, quantity);
      if (threshold !== null) {
        await updateThreshold(product.id, threshold);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
      toast.success('Inventory updated.');
      onClose();
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Could not update inventory.'));
    },
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(31,42,36,0.42)', backdropFilter: 'blur(2px)' }}>
      <div style={{ width: '380px', maxWidth: '100%', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '20px', padding: '28px' }}>
        <div style={{ ...labelMono, marginBottom: '6px' }}>Inventory</div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '20px', color: '#1F2A24', margin: '0 0 20px' }}>{product.name}</h2>

        {isLoading ? (
          <p style={mutedText}>Loading current stock…</p>
        ) : (
          <>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ ...mutedText, fontSize: '13px', display: 'block', marginBottom: '6px' }}>Stock quantity</label>
              <input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E4DCC9', background: '#FBF7F0', ...inkText, fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ ...mutedText, fontSize: '13px', display: 'block', marginBottom: '6px' }}>Low-stock threshold</label>
              <input
                type="number"
                min={0}
                value={threshold ?? 0}
                onChange={(e) => setThreshold(Math.max(0, Number(e.target.value)))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E4DCC9', background: '#FBF7F0', ...inkText, fontSize: '14px', boxSizing: 'border-box' }}
              />
              <p style={{ ...mutedText, fontSize: '12px', margin: '6px 0 0' }}>You'll want to restock once quantity drops to this number or below.</p>
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #E4DCC9', background: '#fff', ...inkText, fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={isLoading || saveMutation.isPending}
            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#2F6F4F', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {saveMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(product.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
      toast.success('Product deleted.');
      onClose();
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Could not delete product.'));
      onClose();
    },
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(31,42,36,0.42)', backdropFilter: 'blur(2px)' }}>
      <div style={{ width: '380px', maxWidth: '100%', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '20px', padding: '28px' }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '20px', color: '#1F2A24', margin: '0 0 10px' }}>Delete this product?</h2>
        <p style={{ ...mutedText, fontSize: '14px', margin: '0 0 24px' }}>
          "{product.name}" will be removed from your store. This can't be undone from here.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #E4DCC9', background: '#fff', ...inkText, fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#B14A2D', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {deleteMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function SellerProductsPage() {
  const navigate = useNavigate();
  const { stores, isLoading: storesLoading, hasApprovedStore } = useSellerStores();
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [inventoryTarget, setInventoryTarget] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const activeStoreId = selectedStoreId ?? stores[0]?.id ?? null;
  const activeStore = stores.find((s) => s.id === activeStoreId) ?? null;
  const isApproved = activeStore?.status === 'Approved';

  const { data, isLoading: productsLoading } = useQuery({
    queryKey: ['my-products', activeStoreId],
    queryFn: () => fetchMyProducts({ page: 1, pageSize: 50, storeId: activeStoreId ?? undefined }),
    enabled: activeStoreId !== null,
  });

  if (storesLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FBF7F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={mutedText}>Loading your stores…</p>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#FBF7F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', padding: '48px', textAlign: 'center', maxWidth: '420px' }}>
          <p style={{ ...inkText, fontFamily: "'Fraunces', serif", fontSize: '20px', fontWeight: 600, margin: '0 0 10px' }}>No stores yet</p>
          <p style={{ ...mutedText, fontSize: '14px', margin: '0 0 20px' }}>Create a store before you can add products.</p>
          <Link to="/seller/stores" style={{ display: 'inline-block', padding: '10px 20px', borderRadius: '10px', background: '#2F6F4F', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
            Go to My Stores
          </Link>
        </div>
      </div>
    );
  }

  const products = data?.items ?? [];
  const statusStyle = activeStore ? getStoreStatusStyle(activeStore.status) : { bg: '#F0ECE2', text: '#8A8273' };

  return (
    <div style={{ minHeight: '100vh', background: '#FBF7F0', fontFamily: "'Inter', sans-serif", color: '#1F2A24', padding: '40px 24px' }}>
      {inventoryTarget && <InventoryModal product={inventoryTarget} onClose={() => setInventoryTarget(null)} />}
      {deleteTarget && <DeleteConfirmModal product={deleteTarget} onClose={() => setDeleteTarget(null)} />}

      <div style={{ maxWidth: '920px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ ...labelMono, marginBottom: '6px' }}>Seller Dashboard</div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '32px', margin: 0 }}>My Products</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {stores.length > 1 && (
              <select
                value={activeStoreId ?? ''}
                onChange={(e) => setSelectedStoreId(Number(e.target.value))}
                style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #E4DCC9', background: '#fff', ...inkText, fontSize: '14px' }}
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}

            <button
              onClick={() => navigate(`/seller/products/new?storeId=${activeStoreId}`)}
              disabled={!isApproved}
              title={isApproved ? undefined : 'Your store must be approved before you can add products.'}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', border: 'none',
                background: isApproved ? '#2F6F4F' : '#A8C4B4', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '14px',
                fontWeight: 600, cursor: isApproved ? 'pointer' : 'not-allowed',
              }}
            >
              <Plus size={16} />
              Add product
            </button>
          </div>
        </div>

        {activeStore && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, background: statusStyle.bg, color: statusStyle.text, fontFamily: "'IBM Plex Mono', monospace" }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusStyle.text, display: 'inline-block' }}></span>
              {activeStore.name} · {activeStore.status}
            </span>
          </div>
        )}

        {!isApproved && (
          <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '10px', background: '#FBF3DE', border: '1px solid #ecd9a3', color: '#9A7B16', fontSize: '13px' }}>
            {activeStore?.status === 'Pending'
              ? 'This store is pending approval. You can see your products below, but adding, editing, deleting, uploading images, and updating inventory are disabled until an admin approves it.'
              : `This store is ${activeStore?.status.toLowerCase()}. Product and inventory management are disabled.`}
          </div>
        )}

        {productsLoading ? (
          <p style={mutedText}>Loading products…</p>
        ) : products.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
            <PackageSearch size={28} color="#A89F8B" style={{ marginBottom: '10px' }} />
            <p style={mutedText}>No products in this store yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {products.map((product) => (
              <div key={product.id} style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#FBF7F0', border: '1px solid #E4DCC9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <ImageOff size={18} color="#A89F8B" />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ ...inkText, fontWeight: 600, fontSize: '14px', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</p>
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#A89F8B', margin: 0 }}>
                    SKU {product.sku} · {product.categoryName}
                  </p>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ ...inkText, fontWeight: 600, fontSize: '14px', margin: '0 0 2px' }}>${product.price.toFixed(2)}</p>
                  <button
                    onClick={() => isApproved && setInventoryTarget(product)}
                    disabled={!isApproved}
                    style={{ ...mutedText, fontSize: '12px', border: 'none', background: 'none', padding: 0, cursor: isApproved ? 'pointer' : 'not-allowed', textDecoration: isApproved ? 'underline' : 'none' }}
                  >
                    {product.stockQuantity} in stock
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button
                    onClick={() => isApproved && navigate(`/seller/products/${product.id}/edit`)}
                    disabled={!isApproved}
                    title={isApproved ? 'Edit' : 'Approve your store to edit products'}
                    style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid #E4DCC9', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isApproved ? 'pointer' : 'not-allowed', opacity: isApproved ? 1 : 0.5 }}
                  >
                    <Pencil size={14} color="#1F2A24" />
                  </button>
                  <button
                    onClick={() => isApproved && setDeleteTarget(product)}
                    disabled={!isApproved}
                    title={isApproved ? 'Delete' : 'Approve your store to delete products'}
                    style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid #E4DCC9', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isApproved ? 'pointer' : 'not-allowed', opacity: isApproved ? 1 : 0.5 }}
                  >
                    <Trash2 size={14} color="#B14A2D" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!hasApprovedStore && stores.length > 0 && (
          <p style={{ ...mutedText, fontSize: '12px', marginTop: '20px' }}>
            None of your stores are approved yet. <Link to="/seller/stores" style={{ color: '#2F6F4F' }}>Check store status</Link>.
          </p>
        )}
      </div>
    </div>
  );
}

export default SellerProductsPage;
