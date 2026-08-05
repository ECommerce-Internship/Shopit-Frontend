import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SkeletonTableRow } from '../components/Skeleton';
import { Loader2 } from 'lucide-react';
import { GenerateContentDrawer } from '../components/GenerateContentDrawer';
import { generateProductContent } from '../api/aiApi';
import toast from 'react-hot-toast';
import {
  createProduct,
  deleteProduct,
  deleteProductImage,
  fetchAdminProducts,
  fetchCategories,
  importProducts,
  importProductsFromSftp,
  updateProduct,
  uploadProductImage,
} from '../api/productsApi';
import { fetchStores } from '../api/storesApi';
import type {
  AdminSortBy,
  ImportResult,
  Product,
  ProductContent,
  SortOrder,
} from '../types/product';

const PAGE_SIZE = 10;

const GRID = '56px minmax(150px,1.7fr) 1.1fr 0.95fr 1.1fr 1.05fr 148px';

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
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

type FormState = {
  name: string;
  sku: string;
  price: string;
  categoryId: number | '';
  storeId: number | '';
  initialStock: string;
  stockQuantity: string;
  lowStockThreshold: string;
  description: string;
  seoTitle: string;
  metaDescription: string;
  features: string[];
  specs: string;
};

const emptyForm: FormState = {
  name: '',
  sku: '',
  price: '',
  categoryId: '',
  storeId: '',
  initialStock: '',
  stockQuantity: '',
  lowStockThreshold: '',
  description: '',
  seoTitle: '',
  metaDescription: '',
  features: [],
  specs: '',
};

function StockBadge({ quantity }: { quantity: number }) {
  const badge =
    quantity === 0
      ? { bg: '#FBEEE8', color: '#B14A2D', label: 'Out' }
      : quantity <= 10
        ? { bg: '#F6EAD2', color: '#A87420', label: 'Low' }
        : { bg: '#E3EEE6', color: '#2F6F4F', label: 'In stock' };
  return (
    <span
      style={{
        fontSize: '10.5px',
        fontFamily: "'IBM Plex Mono', monospace",
        letterSpacing: '0.03em',
        background: badge.bg,
        color: badge.color,
        padding: '3px 8px',
        borderRadius: '20px',
        whiteSpace: 'nowrap',
      }}
    >
      {badge.label}
    </span>
  );
}

function AdminProductsPage() {
  const queryClient = useQueryClient();

  // â”€â”€ list state â”€â”€
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<AdminSortBy>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [page, setPage] = useState(1);

  // Debounce the search box, resetting to page 1 whenever the query settles.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  // â”€â”€ edit / create modal state â”€â”€
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [hasStoredImage, setHasStoredImage] = useState(false);
  const [generated, setGenerated] = useState<ProductContent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // â”€â”€ delete + import modal state â”€â”€
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importState, setImportState] = useState<'select' | 'uploading' | 'result'>('select');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [errorsExpanded, setErrorsExpanded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search, sortBy, sortOrder],
    queryFn: () => fetchAdminProducts({ page, pageSize: PAGE_SIZE, search, sortBy, sortOrder }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  // Approved stores the admin can file the new product under. Admins have no
  // store of their own, so the store must be chosen explicitly on create.
  const { data: stores = [] } = useQuery({
    queryKey: ['stores', 'approved'],
    queryFn: fetchStores,
  });

  const products = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const revokePreview = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  };

  const resetModal = () => {
    revokePreview();
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview(null);
    setHasStoredImage(false);
    setGenerated(null);
    setDrawerOpen(false);
  };

  const openAdd = () => {
    resetModal();
    setEditMode('create');
    setEditId(null);
    setForm({ ...emptyForm, categoryId: categories[0]?.id ?? '' });
    setEditOpen(true);
  };

  const openEdit = (p: Product) => {
    resetModal();
    setEditMode('edit');
    setEditId(p.id);
    setForm({
      name: p.name,
      sku: p.sku,
      price: String(p.price),
      categoryId: p.categoryId,
      storeId: p.storeId ?? '',
      initialStock: '',
      stockQuantity: String(p.stockQuantity),
      lowStockThreshold: '',
      description: p.description ?? '',
      seoTitle: p.seoTitle ?? '',
      metaDescription: p.metaDescription ?? '',
      features: p.features ?? [],
      specs: ''
    });
    setHasStoredImage(!!p.imageUrl);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    resetModal();
  };

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [field]: value }));

  // â”€â”€ sorting â”€â”€
  const toggleSort = (field: AdminSortBy) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };
  const arrow = (field: AdminSortBy) => (sortBy === field ? (sortOrder === 'asc' ? ' â–²' : ' â–¼') : '');

  // â”€â”€ image selection (client preview only; upload is a second call on save) â”€â”€
  const acceptFile = (file: File | null | undefined) => {
    if (!file) return;
    if (!/image\/(jpeg|png)/.test(file.type)) {
      toast.error('Please choose a JPG or PNG image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be 5MB or less.');
      return;
    }
    revokePreview();
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const deleteImageMutation = useMutation({
    mutationFn: (id: number) => deleteProductImage(id),
    onSuccess: () => {
      setHasStoredImage(false);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Image removed.');
    },
    onError: () => toast.error('Could not remove the image.'),
  });

  const removeImage = () => {
    if (imagePreview) {
      // A freshly picked (not-yet-uploaded) image â€” just drop it locally.
      revokePreview();
      setImageFile(null);
      setImagePreview(null);
      return;
    }
    // An already-stored image â€” remove it server-side.
    if (hasStoredImage && editId != null) {
      deleteImageMutation.mutate(editId);
    }
  };

  // â”€â”€ AI content generation (edit mode only â€” needs a persisted product id) â”€â”€
const generateMutation = useMutation({
  mutationFn: () => {
    const categoryName = categories.find(c => c.id === form.categoryId)?.name ?? '';
    return generateProductContent({
      productName: form.name,
      category: categoryName,
      specs: form.specs,
    });
  },
  onSuccess: (content) => {
    setGenerated(content);
    setDrawerOpen(true);
  },
  onError: (err: unknown) => {
    const status = (err as { response?: { status?: number } })?.response?.status;
    toast.error(
      status === 429
        ? 'Too many requests — try again in a moment.'
        : 'Could not generate content.'
    );
  },
});

const handleUseContent = (content: { description: string }) => {
  setForm((f) => ({ ...f, description: content.description }));
  setDrawerOpen(false);
};

  const addFeature = (text: string) =>
    setForm((f) => ({
      ...f,
      features: f.features.includes(text) ? f.features : [...f.features, text],
    }));

  // â”€â”€ save (create/update, then upload the image if one was picked) â”€â”€
  const saveMutation = useMutation({
    mutationFn: async () => {
      const price = parseFloat(form.price) || 0;
      const categoryId = Number(form.categoryId) || 0;
      const imageUrl = editMode === 'edit' && !imageFile && hasStoredImage ? undefined : null;

      let productId: number;
      if (editMode === 'create') {
        const created = await createProduct({
          name: form.name.trim(),
          description: form.description.trim() || null,
          price,
          sku: form.sku.trim(),
          imageUrl,
          categoryId,
          storeId: Number(form.storeId),
          initialStock: parseInt(form.initialStock, 10) || 0,
          lowStockThreshold: parseInt(form.lowStockThreshold, 10) || 10,
        });
        productId = created.id;
      } else {
        const updated = await updateProduct(editId!, {
          name: form.name.trim(),
          description: form.description.trim() || null,
          price,
          sku: form.sku.trim(),
          imageUrl,
          seoTitle: form.seoTitle.trim() || null,
          metaDescription: form.metaDescription.trim() || null,
          features: form.features.length > 0 ? form.features : null,
          categoryId,
          stockQuantity: parseInt(form.stockQuantity, 10) || 0,
        });
        productId = updated.id;
      }

      if (imageFile) await uploadProductImage(productId, imageFile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(editMode === 'create' ? 'Product created.' : 'Product updated.');
      closeEdit();
    },
    onError: () => {
      toast.error('Could not save the product.');
    },
  });

  const handleSave = () => {
    if (!form.name.trim() || !form.sku.trim() || !form.price) {
      toast.error('Name, SKU and Price are required.');
      return;
    }
    if (editMode === 'create' && !form.storeId) {
      toast.error('Please choose a store.');
      return;
    }
    if (!form.categoryId) {
      toast.error('Please choose a category.');
      return;
    }
    saveMutation.mutate();
  };

  // â”€â”€ delete â”€â”€
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setDeleteTarget(null);
      toast.success('Product deleted.');
    },
    onError: () => toast.error('Could not delete the product.'),
  });

  // â”€â”€ import â”€â”€
  const importMutation = useMutation({
    mutationFn: (file: File) => importProducts(file),
    onSuccess: (result) => {
      setImportResult(result);
      setImportState('result');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: () => {
      toast.error('Import failed. Check the file and try again.');
      setImportState('select');
    },
  });

  // â”€â”€ SFTP import (one-click trigger; server pulls the file itself) â”€â”€
  const sftpImportMutation = useMutation({
    mutationFn: () => importProductsFromSftp(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      const base = `Imported ${result.addedCount} product${result.addedCount === 1 ? '' : 's'} from SFTP.`;
      if (result.failedCount > 0) {
        toast.success(`${base} ${result.failedCount} row${result.failedCount === 1 ? '' : 's'} failed.`);
      } else {
        toast.success(base);
      }
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      toast.error(
        status === 404
          ? 'No import file found on the SFTP server.'
          : status === 502
            ? 'Could not reach the SFTP server. Try again later.'
            : 'SFTP import failed. Please try again.'
      );
    },
  });

  const openImport = () => {
    setImportResult(null);
    setErrorsExpanded(false);
    setImportState('select');
    setImportOpen(true);
  };

  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportState('uploading');
    importMutation.mutate(file);
    e.target.value = '';
  };

  const showingText = `Showing ${products.length} of ${totalCount} products`;

  const sortableHeader = (label: string, field: AdminSortBy) => (
    <div onClick={() => toggleSort(field)} style={{ ...labelMono, cursor: 'pointer', userSelect: 'none' }}>
      {label}
      {arrow(field)}
    </div>
  );

  const previewImg = useMemo(
    () =>
      imagePreview ? (
        <img
          src={imagePreview}
          alt="preview"
          style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 9, border: '1px solid #E4DCC9' }}
        />
      ) : null,
    [imagePreview]
  );

  return (
    <div className="admin-enter" style={{ minHeight: '100vh', background: '#FBF7F0', fontFamily: "'Inter', sans-serif", color: '#1F2A24', padding: '40px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '24px', marginBottom: '26px' }}>
          <div>
            <div style={{ ...labelMono, marginBottom: '9px' }}>Shopit Admin</div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '34px', margin: 0, lineHeight: 1 }}>Products</h1>
          </div>
          <div style={{ display: 'flex', gap: '10px', flex: 'none' }}>
            <button onClick={openImport} style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#1F2A24', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '11px', padding: '11px 16px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Import Excel</button>
            <button
              onClick={() => sftpImportMutation.mutate()}
              disabled={sftpImportMutation.isPending}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#1F2A24', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '11px', padding: '11px 16px', cursor: sftpImportMutation.isPending ? 'wait' : 'pointer', opacity: sftpImportMutation.isPending ? 0.7 : 1, whiteSpace: 'nowrap' }}
            >
              {sftpImportMutation.isPending && <Loader2 size={12} className="animate-spin" color="#2F6F4F" />}
              {sftpImportMutation.isPending ? 'Importingâ€¦' : 'Import via SFTP'}
            </button>
            <button onClick={openAdd} style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: '#fff', background: '#2F6F4F', border: '1px solid #2F6F4F', borderRadius: '11px', padding: '11px 18px', cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add Product</button>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '18px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A8273" strokeWidth="2" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="7"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products by name or SKUâ€¦"
            style={{ ...inputStyle, padding: '13px 16px 13px 42px' }}
          />
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', gap: '14px', background: '#FBF7F0', borderBottom: '1px solid #E4DCC9', padding: '13px 22px', minWidth: '820px' }}>
            <div style={labelMono}>Image</div>
            {sortableHeader('Name', 'name')}
            <div style={labelMono}>SKU</div>
            {sortableHeader('Price', 'price')}
            <div style={labelMono}>Category</div>
            <div style={labelMono}>Stock</div>
            <div style={{ ...labelMono, textAlign: 'right' }}>Actions</div>
          </div>

          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <SkeletonTableRow key={i} gridTemplateColumns={GRID} cellCount={7} />
            ))
          ) : products.length === 0 ? (
            <div style={{ padding: '64px 0', textAlign: 'center', color: '#8A8273', fontSize: '14px' }}>No products found.</div>
          ) : (
            products.map((p) => (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', gap: '14px', padding: '16px 22px', borderBottom: '1px solid #F1EAD9', minWidth: '820px' }}>
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', border: '1px solid #E4DCC9' }} />
                ) : (
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'repeating-linear-gradient(45deg,#F5F0E4,#F5F0E4 4px,#EFE8D8 4px,#EFE8D8 8px)', border: '1px solid #E4DCC9' }} />
                )}
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#1F2A24' }}>{p.name}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#8A8273' }}>{p.sku}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#1F2A24' }}>{formatPrice(p.price)}</div>
                <div>
                  <span style={{ display: 'inline-block', fontSize: '11.5px', background: '#F0ECE2', color: '#8A8273', padding: '4px 10px', borderRadius: '20px' }}>{p.categoryName}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#1F2A24' }}>{p.stockQuantity}</span>
                  <StockBadge quantity={p.stockQuantity} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button onClick={() => openEdit(p)} style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 500, color: '#1F2A24', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '9px', padding: '7px 13px', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => setDeleteTarget(p)} style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 500, color: '#B14A2D', background: '#FBEEE8', border: '1px solid #d98a6e', borderRadius: '9px', padding: '7px 13px', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!isLoading && products.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <div style={{ fontSize: '12.5px', color: '#8A8273' }}>{showingText}</div>
            <div style={{ display: 'flex', gap: '9px' }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} style={{ fontFamily: "'Inter', sans-serif", fontSize: '12.5px', color: page <= 1 ? '#C2BBAA' : '#1F2A24', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '9px', padding: '8px 15px', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ fontFamily: "'Inter', sans-serif", fontSize: '12.5px', color: page >= totalPages ? '#C2BBAA' : '#1F2A24', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '9px', padding: '8px 15px', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>Next</button>
            </div>
          </div>
        )}
        </div>
      </div>

   {/* Create / Edit modal */}
      {editOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(31,42,36,0.42)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', zIndex: 50 }}>
          <div style={{ width: '600px', maxWidth: '100%', maxHeight: '88vh', overflowY: 'auto', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '20px', boxShadow: '0 24px 60px rgba(31,42,36,0.20)', padding: '28px' }}>
            <div style={{ ...labelMono, marginBottom: '7px' }}>Product Details</div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '24px', margin: '0 0 22px', color: '#1F2A24' }}>
              {editMode === 'create' ? 'New Product' : 'Edit Product'}
            </h2>

            {editMode === 'create' && (
              <div style={{ marginBottom: '16px' }}>
                <div style={fieldLabel}>Store *</div>
                <select
                  value={form.storeId}
                  onChange={(e) => updateField('storeId', e.target.value === '' ? '' : Number(e.target.value))}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="" disabled>Select a storeâ€¦</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} â€” {s.ownerName}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <div style={fieldLabel}>Name *</div>
                <input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Product name" style={inputStyle} />
              </div>
              <div>
                <div style={fieldLabel}>SKU *</div>
                <input type="text" value={form.sku} onChange={(e) => updateField('sku', e.target.value)} placeholder="ABC-000-0000" style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <div style={fieldLabel}>Price *</div>
                <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '12px', padding: '0 13px' }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', color: '#8A8273' }}>$</span>
                  <input type="number" value={form.price} onChange={(e) => updateField('price', e.target.value)} placeholder="0.00" style={{ width: '100%', fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', color: '#1F2A24', background: 'transparent', border: 'none', padding: '11px 6px', outline: 'none' }} />
                </div>
              </div>
              <div>
                <div style={fieldLabel}>Category *</div>
                <select value={form.categoryId} onChange={(e) => updateField('categoryId', Number(e.target.value))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="" disabled>Select a categoryâ€¦</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {editMode === 'create' ? (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <div style={fieldLabel}>Initial Stock</div>
                  <input type="number" value={form.initialStock} onChange={(e) => updateField('initialStock', e.target.value)} placeholder="0" style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace" }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={fieldLabel}>Low-Stock Threshold</div>
                  <input type="number" value={form.lowStockThreshold} onChange={(e) => updateField('lowStockThreshold', e.target.value)} placeholder="10" style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace" }} />
                </div>
              </>
            ) : (
              <div style={{ marginBottom: '16px' }}>
                <div style={fieldLabel}>Stock Quantity</div>
                <input type="number" value={form.stockQuantity} onChange={(e) => updateField('stockQuantity', e.target.value)} placeholder="0" style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace" }} />
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                <div style={labelMono}>Description</div>
                {editMode === 'edit' && (
                  generateMutation.isPending ? (
                    <button disabled style={{ display: 'flex', alignItems: 'center', gap: '7px', fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 500, color: '#8A8273', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '8px', padding: '5px 11px', cursor: 'wait' }}>
                      <Loader2 size={11} className="animate-spin" color="#2F6F4F" />
                      Generatingâ€¦
                    </button>
                  ) : (
                    <button onClick={() => editId != null && generateMutation.mutate()} style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 500, color: '#2F6F4F', background: '#fff', border: '1px solid #2F6F4F', borderRadius: '8px', padding: '5px 11px', cursor: 'pointer' }}>âœ¨ Generate Content</button>
                  )
                )}
              </div>
              <textarea rows={4} value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Describe the productâ€¦" style={{ ...inputStyle, lineHeight: 1.5, resize: 'vertical' }} />
              {editMode === 'create' && (
                <div style={{ fontSize: '11.5px', color: '#C2BBAA', marginTop: '6px' }}>AI content suggestions are available after the product is saved.</div>
              )}
            </div>

            {generated && (
              <div style={{ background: '#F7FAF8', border: '1px solid #cfe2d5', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ ...labelMono, color: '#2F6F4F', marginBottom: '12px' }}>âœ¨ Suggested by AI</div>
                <div style={{ marginBottom: '11px' }}>
                  <div style={{ ...labelMono, fontSize: '9.5px', letterSpacing: '0.08em', marginBottom: '3px' }}>SEO Title</div>
                  <div style={{ fontSize: '13.5px', color: '#1F2A24' }}>{generated.seoTitle}</div>
                </div>
                <div style={{ marginBottom: '13px' }}>
                  <div style={{ ...labelMono, fontSize: '9.5px', letterSpacing: '0.08em', marginBottom: '3px' }}>Meta Description</div>
                  <div style={{ fontSize: '13px', lineHeight: 1.5, color: '#5c5648' }}>{generated.metaDescription}</div>
                </div>
                <div style={{ ...labelMono, fontSize: '9.5px', letterSpacing: '0.08em', marginBottom: '7px' }}>Feature Bullets â€” click to add</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {generated.features.map((feat, i) => (
                    <button key={i} onClick={() => addFeature(feat)} style={{ display: 'flex', alignItems: 'center', gap: '9px', textAlign: 'left', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#1F2A24', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '10px', padding: '8px 11px', cursor: 'pointer' }}>
                      <span style={{ color: '#2F6F4F', fontWeight: 600 }}>+</span>{feat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Product Image */}
            <div style={{ marginBottom: '22px' }}>
              <div style={fieldLabel}>Product Image</div>
              {imagePreview ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#FBF7F0', border: '1px solid #E4DCC9', borderRadius: '12px', padding: '12px' }}>
                  {previewImg}
                  <div style={{ flex: 1, fontSize: '13px', color: '#5c5648', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{imageFile?.name}</div>
                  <button onClick={removeImage} style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#B14A2D', background: '#FBEEE8', border: '1px solid #d98a6e', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer' }}>Remove</button>
                </div>
              ) : hasStoredImage ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#FBF7F0', border: '1px solid #E4DCC9', borderRadius: '12px', padding: '12px' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 9, background: 'linear-gradient(135deg,#E3EEE6,#cfe2d5)', border: '1px solid #E4DCC9' }} />
                  <div style={{ flex: 1, fontSize: '13px', color: '#5c5648' }}>Current image</div>
                  <button onClick={removeImage} disabled={deleteImageMutation.isPending} style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#B14A2D', background: '#FBEEE8', border: '1px solid #d98a6e', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer' }}>Remove</button>
                </div>
              ) : (
                <label
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); acceptFile(e.dataTransfer.files?.[0]); }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', border: '1.5px dashed #E4DCC9', borderRadius: '12px', padding: '26px', cursor: 'pointer', textAlign: 'center' }}
                >
                  <div style={{ fontSize: '13.5px', color: '#5c5648' }}>Drag &amp; drop an image, or <span style={{ color: '#2F6F4F', fontWeight: 500 }}>browse</span></div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10.5px', color: '#C2BBAA' }}>JPG or PNG Â· max 5MB</div>
                  <input type="file" accept="image/jpeg,image/png" onChange={(e) => acceptFile(e.target.files?.[0])} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #F1EAD9', paddingTop: '20px' }}>
              <button onClick={closeEdit} disabled={saveMutation.isPending} style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#1F2A24', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '11px', padding: '11px 18px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={saveMutation.isPending} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: '#fff', background: '#2F6F4F', opacity: saveMutation.isPending ? 0.7 : 1, border: '1px solid #2F6F4F', borderRadius: '11px', padding: '11px 20px', cursor: saveMutation.isPending ? 'wait' : 'pointer' }}>
                {saveMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                {saveMutation.isPending ? 'Savingâ€¦' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Content Drawer */}
      <GenerateContentDrawer
        open={drawerOpen}
        generated={generated}
        isRegenerating={generateMutation.isPending}
        onClose={() => setDrawerOpen(false)}
        onUseContent={handleUseContent}
        onRegenerate={() => generateMutation.mutate()}
      />

      {/* Delete confirmation */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(31,42,36,0.42)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', zIndex: 50 }}>
          <div style={{ width: '400px', maxWidth: '100%', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '20px', boxShadow: '0 24px 60px rgba(31,42,36,0.20)', padding: '28px', textAlign: 'center' }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: '#FBEEE8', border: '1px solid #e9c8b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', margin: '0 auto 16px' }}>ðŸ—‘</div>
            <div style={{ ...labelMono, marginBottom: '7px' }}>Delete Product</div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '22px', margin: '0 0 10px', color: '#1F2A24' }}>Delete this product?</h2>
            <p style={{ fontSize: '14px', lineHeight: 1.5, color: '#5c5648', margin: '0 0 22px' }}>
              You're about to permanently delete <strong style={{ color: '#1F2A24' }}>{deleteTarget.name}</strong>. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending} style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#1F2A24', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '11px', padding: '11px 18px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: '#fff', background: '#B14A2D', border: '1px solid #B14A2D', borderRadius: '11px', padding: '11px 20px', cursor: 'pointer' }}>
                {deleteMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import modal */}
      {importOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(31,42,36,0.42)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', zIndex: 50 }}>
          <div style={{ width: '480px', maxWidth: '100%', maxHeight: '88vh', overflowY: 'auto', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '20px', boxShadow: '0 24px 60px rgba(31,42,36,0.20)', padding: '28px' }}>
            <div style={{ ...labelMono, marginBottom: '7px' }}>Bulk Import</div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '24px', margin: '0 0 20px', color: '#1F2A24' }}>Import products</h2>

            {importState === 'select' && (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1.5px dashed #E4DCC9', borderRadius: '14px', padding: '38px 20px', cursor: 'pointer', textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '15px', fontWeight: 500, color: '#1F2A24' }}>Select a .xlsx file</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10.5px', color: '#C2BBAA' }}>Excel spreadsheet Â· max 10MB</div>
                <input type="file" accept=".xlsx" onChange={onImportFile} style={{ display: 'none' }} />
              </label>
            )}

            {importState === 'uploading' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '44px 0', marginBottom: '20px' }}>
                <Loader2 size={30} className="animate-spin" color="#2F6F4F" />
                <div style={{ fontSize: '13.5px', color: '#8A8273' }}>Uploading &amp; processingâ€¦</div>
              </div>
            )}

            {importState === 'result' && importResult && (
              <>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ flex: 1, background: '#E3EEE6', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '28px', color: '#2F6F4F', lineHeight: 1 }}>{importResult.addedCount}</div>
                    <div style={{ ...labelMono, fontSize: '10px', letterSpacing: '0.08em', color: '#2F6F4F', marginTop: '5px' }}>Added</div>
                  </div>
                  <div style={{ flex: 1, background: '#FBEEE8', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '28px', color: '#B14A2D', lineHeight: 1 }}>{importResult.failedCount}</div>
                    <div style={{ ...labelMono, fontSize: '10px', letterSpacing: '0.08em', color: '#B14A2D', marginTop: '5px' }}>Failed</div>
                  </div>
                </div>

                {importResult.failedCount > 0 && (
                  <div style={{ border: '1px solid #E4DCC9', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
                    <button onClick={() => setErrorsExpanded((v) => !v)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#1F2A24', background: '#FBF7F0', border: 'none', padding: '12px 15px', cursor: 'pointer' }}>
                      View error details
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#8A8273' }}>{errorsExpanded ? 'âˆ’' : '+'}</span>
                    </button>
                    {errorsExpanded && (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: '12px', padding: '9px 15px', borderTop: '1px solid #E4DCC9', background: '#fff' }}>
                          <div style={{ ...labelMono, fontSize: '10px', letterSpacing: '0.08em' }}>Row</div>
                          <div style={{ ...labelMono, fontSize: '10px', letterSpacing: '0.08em' }}>Reason</div>
                        </div>
                        {importResult.errors.map((err, i) => (
                          <div key={i} style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: '12px', padding: '9px 15px', borderTop: '1px solid #F1EAD9' }}>
                            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12.5px', color: '#B14A2D' }}>{err.row}</div>
                            <div style={{ fontSize: '13px', color: '#5c5648' }}>{err.reason}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #F1EAD9', paddingTop: '18px' }}>
              <button onClick={() => setImportOpen(false)} style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: '#fff', background: '#2F6F4F', border: '1px solid #2F6F4F', borderRadius: '11px', padding: '11px 22px', cursor: 'pointer' }}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProductsPage;
