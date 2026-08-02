import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminTabs } from '../components/AdminTabs';
import { SkeletonTableRow } from '../components/Skeleton';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchCategories } from '../api/productsApi';
import { createCategory, updateCategory, deleteCategory } from '../api/categoriesApi';
import type { Category } from '../types/product';

const NAME_MAX = 150;

const GRID = 'minmax(200px, 2fr) 1.3fr 0.9fr 148px';

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

type FlatRow = { category: Category; depth: number };

// Collect every category by id, walking nested `subcategories` so we have the
// complete set regardless of whether the API returns a tree or a flat list.
function collectAll(cats: Category[], acc = new Map<number, Category>()): Map<number, Category> {
  for (const c of cats) {
    if (!acc.has(c.id)) acc.set(c.id, c);
    if (c.subcategories?.length) collectAll(c.subcategories, acc);
  }
  return acc;
}

// Build parent → children order from `parentCategoryId`, so the table works for
// both response shapes. Roots first, each followed by its descendants (indented).
function buildRows(cats: Category[]): FlatRow[] {
  const all = [...collectAll(cats).values()];
  const childrenOf = new Map<number | null, Category[]>();
  for (const c of all) {
    const key = c.parentCategoryId;
    const list = childrenOf.get(key) ?? [];
    list.push(c);
    childrenOf.set(key, list);
  }
  const sortByName = (a: Category, b: Category) => a.name.localeCompare(b.name);
  const rows: FlatRow[] = [];
  const walk = (parentId: number | null, depth: number) => {
    for (const c of (childrenOf.get(parentId) ?? []).sort(sortByName)) {
      rows.push({ category: c, depth });
      walk(c.id, depth + 1);
    }
  };
  walk(null, 0);
  return rows;
}

// Ids of a category and all its descendants — excluded from parent options so a
// category can't be nested under itself or one of its own children.
function descendantIds(id: number, all: Map<number, Category>): Set<number> {
  const result = new Set<number>([id]);
  const childrenOf = new Map<number | null, Category[]>();
  for (const c of all.values()) {
    const list = childrenOf.get(c.parentCategoryId) ?? [];
    list.push(c);
    childrenOf.set(c.parentCategoryId, list);
  }
  const stack = [id];
  while (stack.length) {
    const current = stack.pop()!;
    for (const child of childrenOf.get(current) ?? []) {
      if (!result.has(child.id)) {
        result.add(child.id);
        stack.push(child.id);
      }
    }
  }
  return result;
}

type FormState = { name: string; parentCategoryId: number | '' };
const emptyForm: FormState = { name: '', parentCategoryId: '' };

function AdminCategoriesPage() {
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  // ── modal state ──
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const rows = useMemo(() => buildRows(categories), [categories]);
  const allById = useMemo(() => collectAll(categories), [categories]);

  // Eligible parents: everything except the category being edited and its
  // descendants (prevents cycles). In create mode, all categories are eligible.
  const parentOptions = useMemo(() => {
    const excluded = editMode === 'edit' && editId != null ? descendantIds(editId, allById) : new Set<number>();
    return [...allById.values()]
      .filter((c) => !excluded.has(c.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allById, editMode, editId]);

  const openAdd = () => {
    setEditMode('create');
    setEditId(null);
    setForm(emptyForm);
    setEditOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditMode('edit');
    setEditId(c.id);
    setForm({ name: c.name, parentCategoryId: c.parentCategoryId ?? '' });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setForm(emptyForm);
    setEditId(null);
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['categories'] });

  const saveMutation = useMutation({
    mutationFn: () => {
      const body = {
        name: form.name.trim(),
        parentCategoryId: form.parentCategoryId === '' ? null : Number(form.parentCategoryId),
      };
      return editMode === 'create'
        ? createCategory(body)
        : updateCategory(editId!, body);
    },
    onSuccess: () => {
      invalidate();
      toast.success(editMode === 'create' ? 'Category created.' : 'Category updated.');
      closeEdit();
    },
    onError: () => toast.error('Could not save the category.'),
  });

  const handleSave = () => {
    const name = form.name.trim();
    if (!name) {
      toast.error('Category name is required.');
      return;
    }
    if (name.length > NAME_MAX) {
      toast.error(`Name must be ${NAME_MAX} characters or less.`);
      return;
    }
    saveMutation.mutate();
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast.success('Category deleted.');
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        toast.error("This category has linked products and can't be deleted.");
        return;
      }
      toast.error('Could not delete the category.');
    },
  });

  const parentName = (id: number | null) => (id == null ? null : allById.get(id)?.name ?? null);

  return (
    <div className="admin-enter" style={{ minHeight: '100vh', background: '#FBF7F0', fontFamily: "'Inter', sans-serif", color: '#1F2A24', padding: '40px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        <AdminTabs active="Categories" />
        <div style={{ flex: 1, minWidth: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '24px', marginBottom: '26px' }}>
          <div>
            <div style={{ ...labelMono, marginBottom: '9px' }}>Shopit Admin</div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '34px', margin: 0, lineHeight: 1 }}>Categories</h1>
          </div>
          <div style={{ display: 'flex', gap: '10px', flex: 'none' }}>
            <button onClick={openAdd} style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: '#fff', background: '#2F6F4F', border: '1px solid #2F6F4F', borderRadius: '11px', padding: '11px 18px', cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add Category</button>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', gap: '14px', background: '#FBF7F0', borderBottom: '1px solid #E4DCC9', padding: '13px 22px', minWidth: '600px' }}>
            <div style={labelMono}>Name</div>
            <div style={labelMono}>Parent</div>
            <div style={labelMono}>Subcategories</div>
            <div style={{ ...labelMono, textAlign: 'right' }}>Actions</div>
          </div>

          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <SkeletonTableRow key={i} gridTemplateColumns={GRID} cellCount={4} />
            ))
          ) : rows.length === 0 ? (
            <div style={{ padding: '64px 0', textAlign: 'center', color: '#8A8273', fontSize: '14px' }}>No categories yet.</div>
          ) : (
            rows.map(({ category, depth }) => (
              <div key={category.id} style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', gap: '14px', padding: '16px 22px', borderBottom: '1px solid #F1EAD9', minWidth: '600px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: `${depth * 22}px`, fontWeight: depth === 0 ? 600 : 400, fontSize: '14px', color: '#1F2A24' }}>
                  {depth > 0 && <span style={{ color: '#C2BBAA' }}>↳</span>}
                  {category.name}
                </div>
                <div style={{ fontSize: '13px', color: parentName(category.parentCategoryId) ? '#5c5648' : '#C2BBAA' }}>
                  {parentName(category.parentCategoryId) ?? '—'}
                </div>
                <div>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12.5px', background: '#F0ECE2', color: '#8A8273', padding: '4px 10px', borderRadius: '20px' }}>
                    {category.subcategoryCount}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button onClick={() => openEdit(category)} style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 500, color: '#1F2A24', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '9px', padding: '7px 13px', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => setDeleteTarget(category)} style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 500, color: '#B14A2D', background: '#FBEEE8', border: '1px solid #d98a6e', borderRadius: '9px', padding: '7px 13px', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
        </div>
      </div>

      {/* Create / Edit modal */}
      {editOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(31,42,36,0.42)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', zIndex: 50 }}>
          <div style={{ width: '480px', maxWidth: '100%', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '20px', boxShadow: '0 24px 60px rgba(31,42,36,0.20)', padding: '28px' }}>
            <div style={{ ...labelMono, marginBottom: '7px' }}>Category Details</div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '24px', margin: '0 0 22px', color: '#1F2A24' }}>
              {editMode === 'create' ? 'New Category' : 'Edit Category'}
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <div style={fieldLabel}>Name *</div>
              <input
                type="text"
                value={form.name}
                maxLength={NAME_MAX}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Category name"
                style={inputStyle}
              />
              <div style={{ fontSize: '11.5px', color: '#C2BBAA', marginTop: '6px', textAlign: 'right' }}>{form.name.length}/{NAME_MAX}</div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <div style={fieldLabel}>Parent Category</div>
              <select
                value={form.parentCategoryId}
                onChange={(e) => setForm((f) => ({ ...f, parentCategoryId: e.target.value === '' ? '' : Number(e.target.value) }))}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">None (top-level)</option>
                {parentOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #F1EAD9', paddingTop: '20px' }}>
              <button onClick={closeEdit} disabled={saveMutation.isPending} style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#1F2A24', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '11px', padding: '11px 18px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={saveMutation.isPending} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: '#fff', background: '#2F6F4F', opacity: saveMutation.isPending ? 0.7 : 1, border: '1px solid #2F6F4F', borderRadius: '11px', padding: '11px 20px', cursor: saveMutation.isPending ? 'wait' : 'pointer' }}>
                {saveMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                {saveMutation.isPending ? 'Saving…' : 'Save Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(31,42,36,0.42)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', zIndex: 50 }}>
          <div style={{ width: '400px', maxWidth: '100%', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '20px', boxShadow: '0 24px 60px rgba(31,42,36,0.20)', padding: '28px', textAlign: 'center' }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: '#FBEEE8', border: '1px solid #e9c8b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', margin: '0 auto 16px' }}>🗑</div>
            <div style={{ ...labelMono, marginBottom: '7px' }}>Delete Category</div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '22px', margin: '0 0 10px', color: '#1F2A24' }}>Delete this category?</h2>
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
    </div>
  );
}

export default AdminCategoriesPage;
