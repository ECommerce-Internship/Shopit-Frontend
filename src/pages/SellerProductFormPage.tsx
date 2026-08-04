import { useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, ImageOff, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchCategories, fetchProductById, createProduct, updateProduct, uploadProductImage, deleteProductImage } from '../api/productsApi';
import { fetchInventoryForProduct, updateThreshold } from '../api/inventoryApi';
import { useSellerStores } from '../hooks/useSellerStores';
import type { Product, Category } from '../types/product';
import type { StoreResponse } from '../api/SellerApi';
import { generateProductContent } from '../api/aiApi';
import { GenerateContentDrawer } from '../components/GenerateContentDrawer';

const inkText = { color: '#1F2A24', fontFamily: "'Inter', sans-serif" };
const mutedText = { color: '#8A8273', fontFamily: "'Inter', sans-serif" };
const labelMono = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: '#8A8273',
};
const fieldStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E4DCC9', background: '#FBF7F0', ...inkText, fontSize: '14px', boxSizing: 'border-box' as const };
const labelStyle = { ...mutedText, fontSize: '13px', display: 'block', marginBottom: '6px' };

function extractErrorMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { status?: number; data?: { message?: string } } };
  if (err?.response?.status === 403) {
    return "You can only manage products in your own store.";
  }
  if (err?.response?.status === 409) {
    return err?.response?.data?.message ?? 'That SKU is already in use in this store.';
  }
  return err?.response?.data?.message ?? fallback;
}

type ProductFormFieldsProps = {
  isEdit: boolean;
  productId: number | null;
  existingProduct: Product | undefined;
  stores: StoreResponse[];
  categories: Category[] | undefined;
  defaultStoreId: number | null;
  initialThreshold: number;
  navigate: ReturnType<typeof useNavigate>;
};

// Keyed by the outer component on the product id (or 'new'), so this mounts
// fresh — with the right initial values already in state — instead of
// syncing fetched data into state via an effect after the fact.
function ProductFormFields({ isEdit, productId, existingProduct, stores, categories, defaultStoreId, initialThreshold, navigate }: ProductFormFieldsProps) {
  const [form, setForm] = useState({
    name: existingProduct?.name ?? '',
    description: existingProduct?.description ?? '',
    price: existingProduct ? String(existingProduct.price) : '',
    sku: existingProduct?.sku ?? '',
    categoryId: (existingProduct?.categoryId ?? '') as number | '',
    stock: existingProduct ? String(existingProduct.stockQuantity) : '0',
    lowStock: String(initialThreshold),
  });
  const { name, description, price, sku, categoryId, stock, lowStock } = form;

  const [storeId, setStoreId] = useState<number | null>(existingProduct?.storeId ?? defaultStoreId);
  const [imageUrl, setImageUrl] = useState<string | null>(existingProduct?.imageUrl ?? null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [specs, setSpecs] = useState('');
  const [generated, setGenerated] = useState<null | { description: string; features: string[]; seoTitle: string; metaDescription: string }>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

const generateMutation = useMutation({
  mutationFn: () => {
    const categoryName = categories?.find(c => c.id === Number(categoryId))?.name ?? '';
    return generateProductContent({ productName: name, category: categoryName, specs });
  },
  onSuccess: (content) => { setGenerated(content); setDrawerOpen(true); },
  onError: () => toast.error('Could not generate content.'),
});

const handleUseContent = (content: { description: string }) => {
  setForm((f) => ({ ...f, description: content.description }));
  setDrawerOpen(false);
};

  const targetStore = storeId !== null ? stores.find((s) => s.id === storeId) : null;

  const deleteImageMutation = useMutation({
    mutationFn: () => deleteProductImage(productId!),
    onSuccess: () => {
      setImageUrl(null);
      toast.success('Image removed.');
    },
    onError: (error: unknown) => toast.error(extractErrorMessage(error, 'Could not remove image.')),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !sku.trim() || categoryId === '' || storeId === null) {
      toast.error('Please fill in name, SKU, category, and store.');
      return;
    }

    const parsedPrice = Number(price);
    const parsedStock = Number(stock);
    const parsedLowStock = Number(lowStock);

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      toast.error('Price must be a number greater than 0.');
      return;
    }
    if (!Number.isFinite(parsedStock) || parsedStock < 0) {
      toast.error('Stock must be a whole number of 0 or more.');
      return;
    }
    if (!Number.isInteger(parsedLowStock) || parsedLowStock < 0) {
      toast.error('Low-stock alert must be a whole number of 0 or more.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && productId !== null) {
        await updateProduct(productId, {
          name: name.trim(),
          description: description.trim() || null,
          price: parsedPrice,
          sku: sku.trim(),
          categoryId: Number(categoryId),
          stockQuantity: parsedStock,
        });
        if (parsedLowStock !== initialThreshold) {
          await updateThreshold(productId, parsedLowStock);
        }
        if (pendingFile) {
          await uploadProductImage(productId, pendingFile);
        }
        toast.success('Product updated.');
      } else {
        const created = await createProduct({
          name: name.trim(),
          description: description.trim() || null,
          price: parsedPrice,
          sku: sku.trim(),
          categoryId: Number(categoryId),
          storeId,
          initialStock: parsedStock,
          lowStockThreshold: parsedLowStock,
        }) as { id: number };
        if (pendingFile) {
          await uploadProductImage(created.id, pendingFile);
        }
        toast.success('Product created.');
      }
      navigate('/seller/products');
    } catch (error) {
      toast.error(extractErrorMessage(error, isEdit ? 'Could not update product.' : 'Could not create product.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto' }}>
      <div style={{ ...labelMono, marginBottom: '6px' }}>Seller Dashboard</div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '28px', margin: '0 0 24px' }}>
        {isEdit ? 'Edit product' : 'Add product'}
      </h1>

      {targetStore && targetStore.status !== 'Approved' && (
        <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '10px', background: '#FBF3DE', border: '1px solid #ecd9a3', color: '#9A7B16', fontSize: '13px' }}>
          "{targetStore.name}" is {targetStore.status.toLowerCase()}. You can't save changes until it's approved.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {!isEdit && stores.length > 1 && (
          <div>
            <label style={labelStyle}>Store</label>
            <select value={storeId ?? ''} onChange={(e) => setStoreId(Number(e.target.value))} style={fieldStyle}>
              <option value="" disabled>Select a store</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label style={labelStyle}>Product name</label>
          <input value={name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={fieldStyle} placeholder="Handmade Ceramic Mug" />
        </div>{/* AI Generate Content */}
          <div style={{ marginBottom: '16px', padding: '14px', borderRadius: '12px', background: '#FAF7FF', border: '1px solid #D9CCF0' }}>
          <div style={{ ...labelMono, color: '#7B5EA7', marginBottom: '8px' }}>✨ AI Content Generation</div>
          <label style={labelStyle}>Key specs</label>
          <textarea
            value={specs}
            onChange={(e) => setSpecs(e.target.value)}
            rows={2}
            placeholder="Enter comma-separated key features e.g. 4K display, 15-hour battery, USB-C"
            style={{ ...fieldStyle, resize: 'vertical', borderColor: '#D9CCF0', marginBottom: '10px' }}
          />
          <button
            type="button"
            onClick={() => generateMutation.mutate()}
            disabled={!name.trim() || generateMutation.isPending}
            style={{ width: '100%', padding: '9px', borderRadius: '8px', border: 'none', background: name.trim() ? '#7B5EA7' : '#C2BBAA', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, cursor: name.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            {generateMutation.isPending ? <><Loader2 size={13} className="animate-spin" /> Generating...</> : '✨ Generate Content'}
          </button>
        </div>

{/* Description */}
        <div>
          <label style={labelStyle}>Description</label>
          <textarea value={description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} style={{ ...fieldStyle, resize: 'vertical' as const }} />
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Price ($)</label>
            <input type="number" min={0.01} step={0.01} value={price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} style={fieldStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>SKU</label>
            <input value={sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} style={fieldStyle} placeholder="MUG-001" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Category</label>
            <select value={categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: Number(e.target.value) }))} style={fieldStyle}>
              <option value="" disabled>Select a category</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>{isEdit ? 'Stock quantity' : 'Initial stock'}</label>
            <input type="number" min={0} value={stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} style={fieldStyle} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Low-stock alert</label>
          <input type="number" min={0} step={1} value={lowStock} onChange={(e) => setForm((f) => ({ ...f, lowStock: e.target.value }))} style={fieldStyle} />
          <p style={{ ...mutedText, fontSize: '12px', margin: '6px 0 0' }}>
            Flag this product as low on stock once its quantity drops to this number or below.
          </p>
        </div>

        <div>
          <label style={labelStyle}>Product image</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: '#FBF7F0', border: '1px solid #E4DCC9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
              {pendingFile ? (
                <img src={URL.createObjectURL(pendingFile)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : imageUrl ? (
                <img src={imageUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <ImageOff size={18} color="#A89F8B" />
              )}
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
              style={{ ...mutedText, fontSize: '13px' }}
            />
            {isEdit && imageUrl && !pendingFile && (
              <button
                type="button"
                onClick={() => deleteImageMutation.mutate()}
                disabled={deleteImageMutation.isPending}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', border: 'none', background: 'none', color: '#B14A2D', fontSize: '12px', cursor: 'pointer' }}
              >
                <X size={12} /> Remove
              </button>
            )}
          </div>
          <p style={{ ...mutedText, fontSize: '12px', margin: '6px 0 0' }}>JPG or PNG, up to 5MB.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <Link
            to="/seller/products"
            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #E4DCC9', background: '#fff', ...inkText, fontSize: '14px', fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || (targetStore ? targetStore.status !== 'Approved' : false)}
            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#2F6F4F', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: submitting ? 0.7 : 1 }}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? 'Save changes' : 'Create product'}
          </button>
        </div>
        <GenerateContentDrawer
        open={drawerOpen}
        generated={generated}
        isRegenerating={generateMutation.isPending}
        onClose={() => setDrawerOpen(false)}
        onUseContent={handleUseContent}
        onRegenerate={() => generateMutation.mutate()}
      />
      </form>
    </div>
  );
}

function SellerProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const productId = id ? Number(id) : null;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { stores, isLoading: storesLoading } = useSellerStores();

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

  const { data: existingProduct, isLoading: productLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProductById(String(productId)),
    enabled: isEdit && productId !== null,
  });

  // The low-stock threshold lives on the inventory record, not the product, so
  // load it separately when editing to seed the form. New products default to 10.
  const { data: inventory, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory', productId],
    queryFn: () => fetchInventoryForProduct(productId!),
    enabled: isEdit && productId !== null,
  });

  const ownedStoreIds = new Set(stores.map((s) => s.id));

  // Guard against a seller reaching another seller's product via a guessed URL:
  // check ownership client-side before ever rendering the form (the backend
  // enforces this too on every mutation — this just avoids a confusing flow).
  const isForeignProduct = isEdit && existingProduct !== undefined && !ownedStoreIds.has(existingProduct.storeId);

  if (storesLoading || (isEdit && (productLoading || inventoryLoading))) {
    return (
      <div style={{ minHeight: '100vh', background: '#FBF7F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={mutedText}>Loading…</p>
      </div>
    );
  }

  if (isForeignProduct) {
    return (
      <div style={{ minHeight: '100vh', background: '#FBF7F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', padding: '48px', textAlign: 'center', maxWidth: '420px' }}>
          <p style={{ ...inkText, fontFamily: "'Fraunces', serif", fontSize: '20px', fontWeight: 600, margin: '0 0 10px' }}>Not your product</p>
          <p style={{ ...mutedText, fontSize: '14px', margin: '0 0 20px' }}>This product belongs to a different store. You can only manage products in stores you own.</p>
          <Link to="/seller/products" style={{ display: 'inline-block', padding: '10px 20px', borderRadius: '10px', background: '#2F6F4F', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
            Back to My Products
          </Link>
        </div>
      </div>
    );
  }

  const defaultStoreId = searchParams.get('storeId') ? Number(searchParams.get('storeId')) : (stores[0]?.id ?? null);

  return (
    <div style={{ minHeight: '100vh', background: '#FBF7F0', fontFamily: "'Inter', sans-serif", color: '#1F2A24', padding: '40px 24px' }}>
      <ProductFormFields
        key={isEdit ? productId : 'new'}
        isEdit={isEdit}
        productId={productId}
        existingProduct={existingProduct}
        stores={stores}
        categories={categories}
        defaultStoreId={defaultStoreId}
        initialThreshold={inventory?.lowStockThreshold ?? 10}
        navigate={navigate}
      />
    </div>
  );
}

export default SellerProductFormPage;
