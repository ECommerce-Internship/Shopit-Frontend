import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminDeleteReview, approveReview, rejectReview, getAllReviews, fetchModerationQueue, type ReviewFilters } from '../api/reviewsApi';
import { fetchStores } from '../api/storesApi';
import type { Review } from '../types/review';

const labelMono = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '10.5px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: '#8A8273',
};

const selectStyle = {
  border: '1px solid #E4DCC9',
  background: '#fff',
  color: '#1F2A24',
  borderRadius: '9px',
  padding: '9px 12px',
  fontFamily: "'Inter', sans-serif",
  fontSize: '12.5px',
  cursor: 'pointer',
};

const CATEGORIES = ['genuine', 'spam', 'fake_promotional', 'toxic', 'incoherent', 'off_topic'];
const STATUSES = ['Pending', 'Approved', 'Flagged', 'Rejected'];

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} style={{ fontSize: '14px', color: star <= rating ? '#D97B3F' : '#D9CFC0' }}>★</span>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    Approved: { bg: '#E3EEE6', color: '#2F6F4F' },
    Pending: { bg: '#F6EAD2', color: '#A87420' },
    Flagged: { bg: '#FBEEE8', color: '#B14A2D' },
    Rejected: { bg: '#F1EAE3', color: '#8A6A56' },
  };
  const style = styles[status] ?? { bg: '#F1EAD9', color: '#8A8273' };
  return (
    <span style={{ ...labelMono, backgroundColor: style.bg, color: style.color, padding: '4px 10px', borderRadius: '999px', display: 'inline-block' }}>
      {status}
    </span>
  );
}

function DeleteModal({ review, onConfirm, onCancel, isPending }: {
  review: Review;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(31,42,36,0.42)', backdropFilter: 'blur(2px)' }}>
      <div style={{ width: '400px', maxWidth: '100%', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '20px', boxShadow: '0 24px 60px rgba(31,42,36,0.20)', padding: '28px', textAlign: 'center' }}>
        <div style={{ width: '54px', height: '54px', margin: '0 auto 18px', borderRadius: '50%', background: '#FBEEE8', border: '1px solid #e9c8b8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B14A2D', fontSize: '22px' }}>🗑</div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8273', marginBottom: '10px' }}>Delete Review</div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '26px', lineHeight: 1.1, margin: '0 0 12px', color: '#1F2A24' }}>Delete this review?</h2>
        <p style={{ fontSize: '14.5px', lineHeight: 1.6, color: '#5c5648', margin: '0 auto 26px', maxWidth: '300px' }}>
          By <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#1F2A24' }}>{review.reviewerFirstName} {review.reviewerLastName}</span>. This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onCancel} disabled={isPending} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #E4DCC9', background: '#fff', color: '#1F2A24', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} disabled={isPending} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #B14A2D', background: '#B14A2D', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectModal({ review, onConfirm, onCancel, isPending }: {
  review: Review;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(31,42,36,0.42)', backdropFilter: 'blur(2px)' }}>
      <div style={{ width: '420px', maxWidth: '100%', background: '#fff', border: '1px solid #E4DCC9', borderRadius: '20px', boxShadow: '0 24px 60px rgba(31,42,36,0.20)', padding: '28px' }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8273', marginBottom: '10px' }}>Reject Review</div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '22px', lineHeight: 1.1, margin: '0 0 16px', color: '#1F2A24' }}>
          By {review.reviewerFirstName} {review.reviewerLastName}
        </h2>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          rows={3}
          style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E4DCC9', backgroundColor: '#FBF7F0', fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#1F2A24', resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: '20px' }}
        />
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onCancel} disabled={isPending} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #E4DCC9', background: '#fff', color: '#1F2A24', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onConfirm(reason)} disabled={isPending} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #B14A2D', background: '#B14A2D', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'all' | 'queue'>('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Review | null>(null);

  const { data: stores = [] } = useQuery({
    queryKey: ['admin-stores-approved'],
    queryFn: fetchStores,
  });

  const filters: ReviewFilters = {
    status: statusFilter || undefined,
    storeId: storeFilter ? Number(storeFilter) : undefined,
    category: categoryFilter || undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: [view === 'all' ? 'admin-reviews' : 'moderation-queue', page, statusFilter, storeFilter, categoryFilter],
    queryFn: () => (view === 'all' ? getAllReviews(page, 10, filters) : fetchModerationQueue(page, 10, filters)),
  });

  const deleteMutation = useMutation({
    mutationFn: (reviewId: number) => adminDeleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
      setSelectedReview(null);
      toast.success('Review deleted.');
    },
    onError: () => {
      toast.error('Could not delete review.');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (reviewId: number) => approveReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
      toast.success('Review approved.');
    },
    onError: () => {
      toast.error('Could not approve review.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ reviewId, reason }: { reviewId: number; reason: string }) => rejectReview(reviewId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
      setRejectTarget(null);
      toast.success('Review rejected.');
    },
    onError: () => {
      toast.error('Could not reject review.');
    },
  });

  const reviews = data?.reviews ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / 10);

  return (
    <div className="admin-enter" style={{ minHeight: '100vh', background: '#FBF7F0', fontFamily: "'Inter', sans-serif", color: '#1F2A24', padding: '40px' }}>
      {selectedReview && (
        <DeleteModal
          review={selectedReview}
          onConfirm={() => deleteMutation.mutate(selectedReview.id)}
          onCancel={() => setSelectedReview(null)}
          isPending={deleteMutation.isPending}
        />
      )}
      {rejectTarget && (
        <RejectModal
          review={rejectTarget}
          onConfirm={(reason) => rejectMutation.mutate({ reviewId: rejectTarget.id, reason })}
          onCancel={() => setRejectTarget(null)}
          isPending={rejectMutation.isPending}
        />
      )}

      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>

        {/* Header */}
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A8273', marginBottom: '8px' }}>Shopit Admin</div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '34px', lineHeight: 1, margin: 0 }}>Reviews</h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { setView('all'); setPage(1); }}
              style={{ border: '1px solid #E4DCC9', background: view === 'all' ? '#2F6F4F' : '#fff', color: view === 'all' ? '#fff' : '#1F2A24', borderRadius: '10px', padding: '10px 16px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              All Reviews
            </button>
            <button
              onClick={() => { setView('queue'); setPage(1); }}
              style={{ border: '1px solid #E4DCC9', background: view === 'queue' ? '#2F6F4F' : '#fff', color: view === 'queue' ? '#fff' : '#1F2A24', borderRadius: '10px', padding: '10px 16px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Moderation Queue
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {view === 'all' && (
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={selectStyle}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          <select value={storeFilter} onChange={(e) => { setStoreFilter(e.target.value); setPage(1); }} style={selectStyle}>
            <option value="">All stores</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} style={selectStyle}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #E4DCC9', borderRadius: '16px', overflow: 'hidden' }}>
          {/* Head row */}
          <div style={{ display: 'grid', gridTemplateColumns: '0.7fr 1fr 1.1fr 0.9fr 0.9fr 0.9fr 1.2fr', gap: '14px', padding: '14px 22px', background: '#FBF7F0', borderBottom: '1px solid #E4DCC9', ...labelMono }}>
            <div>Review ID</div>
            <div>Product</div>
            <div>Reviewer</div>
            <div>Rating</div>
            <div>Date</div>
            <div>Status</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
              <Loader2 size={24} className="animate-spin" color="#8A8273" />
            </div>
          ) : reviews.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
              <p style={{ color: '#8A8273' }}>{view === 'queue' ? 'No reviews awaiting moderation.' : 'No reviews found.'}</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} style={{ display: 'grid', gridTemplateColumns: '0.7fr 1fr 1.1fr 0.9fr 0.9fr 0.9fr 1.2fr', gap: '14px', alignItems: 'center', padding: '16px 22px', borderBottom: '1px solid #F1EAD9' }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#8A8273' }}>#RV-{review.id.toString().padStart(4, '0')}</div>
                <div style={{ fontSize: '13.5px', color: '#1F2A24', fontWeight: 600 }}>Product #{review.productId}</div>
                <div>
                  <div style={{ fontSize: '13.5px', color: '#1F2A24', fontWeight: 600 }}>{review.reviewerFirstName} {review.reviewerLastName}</div>
                  {review.comment && <div style={{ fontSize: '12px', color: '#8A8273', marginTop: '2px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{review.comment}</div>}
                  {review.moderationReason && <div style={{ fontSize: '11px', color: '#B14A2D', marginTop: '4px' }}>{review.moderationReason}{review.moderationScore != null ? ' (' + Math.round(review.moderationScore * 100) + '% confidence)' : ''}</div>}
                </div>
                <div><StarDisplay rating={review.rating} /></div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12.5px', color: '#5c5648' }}>{formatDate(review.createdAt)}</div>
                <div><StatusBadge status={review.status} /></div>
                <div style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  {review.status === 'Flagged' && (
                    <>
                      <button
                        onClick={() => approveMutation.mutate(review.id)}
                        disabled={approveMutation.isPending}
                        style={{ border: '1px solid #2F6F4F', background: '#E3EEE6', color: '#2F6F4F', borderRadius: '9px', padding: '8px 12px', fontFamily: "'Inter', sans-serif", fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Check size={13} /> Approve
                      </button>
                      <button
                        onClick={() => setRejectTarget(review)}
                        style={{ border: '1px solid #d98a6e', background: '#FBEEE8', color: '#B14A2D', borderRadius: '9px', padding: '8px 12px', fontFamily: "'Inter', sans-serif", fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        <X size={13} /> Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedReview(review)}
                    style={{ border: '1px solid #d98a6e', background: '#FBEEE8', color: '#B14A2D', borderRadius: '9px', padding: '8px 14px', fontFamily: "'Inter', sans-serif", fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px' }}>
            <div style={{ fontSize: '12.5px', color: '#8A8273' }}>Showing {reviews.length} of {totalCount} reviews</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ border: '1px solid #E4DCC9', background: '#fff', color: page === 1 ? '#C2BBAA' : '#1F2A24', borderRadius: '8px', padding: '7px 12px', fontFamily: "'Inter', sans-serif", fontSize: '12.5px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ border: '1px solid #E4DCC9', background: '#fff', color: page >= totalPages ? '#C2BBAA' : '#1F2A24', borderRadius: '8px', padding: '7px 12px', fontFamily: "'Inter', sans-serif", fontSize: '12.5px', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>Next</button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default AdminReviewsPage;
